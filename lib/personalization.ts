import { prisma } from "@/lib/prisma";
import { AIAnalysisResult } from "@/lib/gemini";

export type PriorityTier = "critical" | "high" | "medium" | "low" | "ignore";

export interface PersonalizedDecision {
  category: string;
  priority: PriorityTier;
  requiresAction: boolean;
  actionType: "event" | "task" | "none";
  confidence: number;
  reason: string; // Human-readable explanation
  eventProposal: AIAnalysisResult["eventProposal"];
  taskProposal: AIAnalysisResult["taskProposal"];
  tags: string[];
  summary: string;
  deadline?: string | null;
  isPersonalized: boolean;
}

// Normalized priority values
export const PRIORITY_SCORES: Record<PriorityTier, number> = {
  ignore: 0.0,
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1.0,
};

export function scoreToPriority(score: number): PriorityTier {
  if (score <= 0.15) return "ignore";
  if (score <= 0.38) return "low";
  if (score <= 0.65) return "medium";
  if (score <= 0.88) return "high";
  return "critical";
}

/**
 * Normalizes an email address or domain for sender-based rule lookups
 */
export function extractSenderKey(senderRaw: string): { emailKey: string; domainKey?: string } {
  const match = senderRaw.match(/<([^>]+)>/) || [null, senderRaw];
  const email = (match[1] || senderRaw).trim().toLowerCase();
  const parts = email.split("@");
  const domainKey = parts.length === 2 ? parts[1] : undefined;
  return { emailKey: email, domainKey };
}

/**
 * Server-side personalization layer between generic AI analysis and the final MailEven decision.
 * Flow:
 * EMAIL -> Generic AI analysis -> Retrieve User Preferences -> Personalization Engine -> Personalized Decision
 */
export async function applyPersonalization(
  userId: string,
  analysis: AIAnalysisResult,
  senderRaw: string
): Promise<PersonalizedDecision> {
  const categoryKey = (analysis.category || "General").toLowerCase();
  const { emailKey, domainKey } = extractSenderKey(senderRaw);

  // Retrieve user's learned preferences isolated to this authenticated user
  const userPreferences = await prisma.userPreference.findMany({
    where: {
      userId,
      OR: [
        { type: "category", key: categoryKey },
        { type: "sender", key: emailKey },
        ...(domainKey ? [{ type: "sender", key: domainKey }] : []),
        { type: "action", key: "deadline" },
        { type: "action", key: "meeting" },
      ],
    },
  });

  const categoryPref = userPreferences.find((p) => p.type === "category" && p.key === categoryKey);
  const senderPref =
    userPreferences.find((p) => p.type === "sender" && p.key === emailKey) ||
    (domainKey ? userPreferences.find((p) => p.type === "sender" && p.key === domainKey) : undefined);
  const deadlineActionPref = userPreferences.find((p) => p.type === "action" && p.key === "deadline");
  const meetingActionPref = userPreferences.find((p) => p.type === "action" && p.key === "meeting");

  // Baseline generic priority score
  let baseScore = PRIORITY_SCORES[analysis.priority] ?? 0.5;
  let totalWeight = 1.0;
  let accumulatedScore = baseScore;
  let isPersonalized = false;
  const reasonParts: string[] = [];

  // Blend category preference
  if (categoryPref && categoryPref.interactionCount > 0) {
    // Weight proportional to confidence (up to 1.5x of baseline)
    const weight = Math.min(1.5, categoryPref.confidence * 1.5);
    accumulatedScore += categoryPref.score * weight;
    totalWeight += weight;
    isPersonalized = true;

    const catPriority = scoreToPriority(categoryPref.score);
    if (catPriority === "high" || catPriority === "critical") {
      reasonParts.push(`you frequently prioritize ${analysis.category} emails`);
    } else if (catPriority === "low" || catPriority === "ignore") {
      reasonParts.push(`you usually de-prioritize ${analysis.category} emails`);
    }
  }

  // Blend sender preference
  if (senderPref && senderPref.interactionCount > 0) {
    const weight = Math.min(1.8, senderPref.confidence * 1.8);
    accumulatedScore += senderPref.score * weight;
    totalWeight += weight;
    isPersonalized = true;

    const senderPriority = scoreToPriority(senderPref.score);
    if (senderPriority === "high" || senderPriority === "critical") {
      reasonParts.push(`you prioritize messages from ${senderPref.key}`);
    } else if (senderPriority === "low" || senderPriority === "ignore") {
      reasonParts.push(`you frequently mark messages from ${senderPref.key} as low priority`);
    }
  }

  const finalScore = accumulatedScore / totalWeight;
  const finalPriority = scoreToPriority(finalScore);

  // Action preferences
  let finalActionType = analysis.actionType;
  let finalRequiresAction = analysis.requiresAction;
  let taskProposal = analysis.taskProposal;
  let eventProposal = analysis.eventProposal;

  // If user has learned preference to convert deadlines to tasks:
  if (analysis.deadline && deadlineActionPref?.preferredAction === "task") {
    finalActionType = "task";
    finalRequiresAction = true;
    if (!taskProposal) {
      taskProposal = {
        title: analysis.summary.slice(0, 60),
        dueDate: new Date(analysis.deadline).toISOString(),
        notes: `Action created via learned deadline preference. ${analysis.summary}`,
        priority: finalPriority === "critical" || finalPriority === "high" ? "high" : "medium",
      };
    }
    if (!reasonParts.some((r) => r.includes("deadline"))) {
      reasonParts.push("you prefer creating tasks for upcoming deadlines");
      isPersonalized = true;
    }
  }

  // If user has learned preference to convert meetings to calendar events:
  if (meetingActionPref?.preferredAction === "event" && analysis.actionType === "event") {
    finalActionType = "event";
    finalRequiresAction = true;
  }

  // If priority is "ignore" based on strong learned preference:
  if (finalPriority === "ignore") {
    finalRequiresAction = false;
    finalActionType = "none";
  }

  // Build transparent, human-readable reason
  let reason = "Default AI priority based on message content.";
  if (isPersonalized && reasonParts.length > 0) {
    const capitalizedPriority = finalPriority.charAt(0).toUpperCase() + finalPriority.slice(1);
    reason = `${capitalizedPriority} priority because ${reasonParts.join(" and ")}.`;
  }

  // Calculate overall confidence (blend of AI extraction + preference confidence)
  const prefConfidences = [categoryPref?.confidence, senderPref?.confidence].filter(
    (c): c is number => typeof c === "number"
  );
  const blendedConfidence =
    prefConfidences.length > 0
      ? (analysis.confidence + prefConfidences.reduce((a, b) => a + b, 0) / prefConfidences.length) / 2
      : analysis.confidence;

  // Add category tag if not already in tags
  const tags = [...analysis.tags];
  if (!tags.includes(analysis.category)) {
    tags.unshift(analysis.category);
  }

  return {
    category: analysis.category,
    priority: finalPriority,
    requiresAction: finalRequiresAction,
    actionType: finalActionType,
    confidence: Number(blendedConfidence.toFixed(2)),
    reason,
    eventProposal,
    taskProposal,
    tags,
    summary: analysis.summary,
    deadline: analysis.deadline,
    isPersonalized,
  };
}

/**
 * Updates a user preference using exponential moving average / learning rate:
 * newScore = oldScore + learningRate * (targetScore - oldScore)
 */
export async function updatePreferenceScore(
  userId: string,
  type: "category" | "sender" | "action",
  key: string,
  targetScore: number,
  learningRate = 0.25,
  preferredAction?: "task" | "event" | "none"
) {
  const normalizedKey = key.trim().toLowerCase();

  const existing = await prisma.userPreference.findUnique({
    where: {
      userId_type_key: {
        userId,
        type,
        key: normalizedKey,
      },
    },
  });

  if (!existing) {
    // Initial evidence
    return await prisma.userPreference.create({
      data: {
        userId,
        type,
        key: normalizedKey,
        score: targetScore,
        confidence: 0.3,
        interactionCount: 1,
        preferredAction: preferredAction || null,
      },
    });
  }

  // Adaptive learning rate: high early on, gradual as interaction count grows
  const effectiveLearningRate = Math.max(0.12, learningRate / Math.sqrt(existing.interactionCount));
  const newScore = existing.score + effectiveLearningRate * (targetScore - existing.score);
  const newConfidence = Math.min(0.98, existing.confidence + 0.12);

  return await prisma.userPreference.update({
    where: { id: existing.id },
    data: {
      score: Number(newScore.toFixed(4)),
      confidence: Number(newConfidence.toFixed(4)),
      interactionCount: existing.interactionCount + 1,
      preferredAction: preferredAction !== undefined ? preferredAction : existing.preferredAction,
    },
  });
}

/**
 * Records explicit user correction (e.g. User changes priority from Medium -> High or changes action)
 */
export async function recordExplicitCorrection(
  userId: string,
  emailId: string,
  categoryOrNewPriority: string,
  sender?: string,
  previousPriority?: string,
  previousAction?: string,
  correctedPriority?: PriorityTier | string,
  correctedAction?: string,
  userReason?: string
) {
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  if (!email) throw new Error("Email not found or unauthorized");

  // Handle both signatures:
  // Signature A: (userId, emailId, newPriority)
  // Signature B: (userId, emailId, category, sender, prevPri, prevAct, newPri, newAct, reason)
  const effectiveNewPriority: PriorityTier = (
    correctedPriority && PRIORITY_SCORES[correctedPriority as PriorityTier] !== undefined
      ? correctedPriority
      : PRIORITY_SCORES[categoryOrNewPriority as PriorityTier] !== undefined
      ? categoryOrNewPriority
      : "medium"
  ) as PriorityTier;

  const targetScore = PRIORITY_SCORES[effectiveNewPriority];
  const categoryKey = (email.category || categoryOrNewPriority || "General").toLowerCase();
  const { emailKey, domainKey } = extractSenderKey(sender || email.sender);

  const preferredAction = (correctedAction || (email.actionType as any)) as ("task" | "event" | "none") | undefined;

  // 1. Update Category Preference
  await updatePreferenceScore(userId, "category", categoryKey, targetScore, 0.28, preferredAction);

  // 2. Update Sender Preference
  await updatePreferenceScore(userId, "sender", emailKey, targetScore, 0.22, preferredAction);
  if (domainKey && !domainKey.includes("gmail.com") && !domainKey.includes("yahoo.com") && !domainKey.includes("outlook.com")) {
    await updatePreferenceScore(userId, "sender", domainKey, targetScore, 0.15, preferredAction);
  }

  // 3. Record in InteractionHistory (Strict privacy: NO raw body stored)
  const explanation = userReason || `User corrected priority from "${previousPriority || email.priority}" to "${effectiveNewPriority}" for category "${email.category}".`;
  await prisma.interactionHistory.create({
    data: {
      userId,
      emailId: email.id,
      category: email.category,
      sender: emailKey,
      aiPredictedPriority: previousPriority || email.priority || "medium",
      aiPredictedAction: previousAction || email.actionType || "none",
      userFeedback: effectiveNewPriority,
      feedbackType: "explicit_priority",
      explanation,
    },
  });

  // 4. Update the Email record with new priority & reason
  const updatedReason = userReason || `Priority adjusted to ${effectiveNewPriority} based on your recent correction.`;
  return await prisma.email.update({
    where: { id: email.id },
    data: {
      priority: effectiveNewPriority,
      actionType: preferredAction || email.actionType,
      personalizationReason: updatedReason,
      personalizationConfidence: 1.0,
      isActionable: effectiveNewPriority !== "ignore" && email.isActionable,
    },
  });
}

/**
 * Records implicit behavior: Task Creation
 */
export async function recordImplicitTaskCreation(userId: string, emailId: string, categoryHint?: string, senderHint?: string) {
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  const category = categoryHint || email?.category || "General";
  const sender = senderHint || email?.sender || "";
  const categoryKey = category.toLowerCase();
  const { emailKey } = extractSenderKey(sender);

  // Boost category priority slightly and reinforce "deadline" -> "task" action preference
  await updatePreferenceScore(userId, "category", categoryKey, 0.8, 0.15);
  await updatePreferenceScore(userId, "action", "deadline", 0.8, 0.25, "task");

  await prisma.interactionHistory.create({
    data: {
      userId,
      emailId,
      category,
      sender: emailKey,
      aiPredictedAction: email?.actionType || "task",
      userFeedback: "task_created",
      feedbackType: "implicit_task",
      explanation: `Task created from email. Reinforced task preference for ${category}.`,
    },
  });
}

/**
 * Records implicit behavior: Calendar Event Creation
 */
export async function recordImplicitCalendarCreation(userId: string, emailId: string, categoryHint?: string, senderHint?: string) {
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  const category = categoryHint || email?.category || "General";
  const sender = senderHint || email?.sender || "";
  const categoryKey = category.toLowerCase();
  const { emailKey } = extractSenderKey(sender);

  // Boost sender and category importance, reinforce "meeting" -> "event" action preference
  await updatePreferenceScore(userId, "sender", emailKey, 0.85, 0.18);
  await updatePreferenceScore(userId, "category", categoryKey, 0.75, 0.15);
  await updatePreferenceScore(userId, "action", "meeting", 0.85, 0.25, "event");

  await prisma.interactionHistory.create({
    data: {
      userId,
      emailId,
      category,
      sender: emailKey,
      aiPredictedAction: email?.actionType || "event",
      userFeedback: "event_created",
      feedbackType: "implicit_calendar",
      explanation: `Calendar event scheduled. Reinforced meeting preference for ${emailKey}.`,
    },
  });
}

/**
 * Records implicit behavior: Briefing Dismissal
 */
export async function recordImplicitDismissal(userId: string, emailId: string, categoryHint?: string, senderHint?: string) {
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  const category = categoryHint || email?.category || "General";
  const sender = senderHint || email?.sender || "";
  const categoryKey = category.toLowerCase();
  const { emailKey } = extractSenderKey(sender);

  // Subtle downward signal on category (learning rate 0.08, not harsh)
  await updatePreferenceScore(userId, "category", categoryKey, 0.35, 0.08);

  await prisma.interactionHistory.create({
    data: {
      userId,
      emailId,
      category,
      sender: emailKey,
      userFeedback: "dismissed",
      feedbackType: "implicit_dismiss",
      explanation: `Email dismissed from action briefing.`,
    },
  });
}
