import { createGroqClient } from "@/lib/groq";

export interface AIAnalysisResult {
  summary: string;
  category: string; // e.g. "College", "Internship", "Work", "Shopping", "Finance", "Travel", "Newsletters", "Promotions", "Personal"
  priority: "low" | "medium" | "high" | "critical" | "ignore";
  requiresAction: boolean;
  isActionable: boolean; // Backwards-compatible alias for requiresAction
  actionType: "event" | "task" | "none";
  deadline?: string | null; // ISO Date string or null
  senderType?: "university" | "corporate" | "retail" | "newsletter" | "personal" | "system";
  confidence: number; // 0.0 to 1.0
  tags: string[];
  eventProposal: {
    title: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    location?: string;
    description?: string;
  } | null;
  taskProposal: {
    title: string;
    dueDate?: string; // ISO String or YYYY-MM-DD
    notes?: string;
    priority?: "low" | "medium" | "high";
  } | null;
}

export async function analyzeEmailWithGroq(
  subject: string,
  sender: string,
  body: string,
  receivedAt: Date = new Date()
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  // Keep the client server-only: this module is imported exclusively by API routes.
  if (apiKey) {
    try {
      const groq = createGroqClient(apiKey);
      const prompt = `You are the AI core for MailEven, an executive email action-management assistant.
Analyze this email and extract structured data, classifications, actions, and an executive briefing.

EMAIL METADATA:
- Sender: ${sender}
- Subject: ${subject}
- Received Time: ${receivedAt.toISOString()}
- Email Body:
"""
${body.slice(0, 4000)}
"""

REQUIREMENTS:
1. summary: A crisp 1-2 sentence executive briefing capturing the key context and why it matters.
2. category: Primary category. Choose the best fitting from: ["College", "Internship", "Work", "Shopping", "Finance", "Travel", "Newsletters", "Promotions", "Personal"].
3. priority: Baseline generic priority without user personalization: "critical" (immediate emergency/same-day deadline), "high" (important deliverable/interview/audit/urgent request), "medium" (normal inquiry/meeting request), "low" (receipt/non-urgent notification/shipping update), or "ignore" (spam/unsolicited promotion/newsletter).
4. requiresAction: boolean. True if the email requires calendar scheduling, RSVP, reply, task completion, or deadline follow-up.
5. actionType: "event" (if it contains a meeting, flight, reservation, webinar, call with a specific time), "task" (if it contains action items, requests, deadlines, review requests), or "none".
6. deadline: Explicit ISO 8601 date string (e.g. "2026-09-12") or ISO timestamp if an explicit deadline is mentioned in the text, otherwise null.
7. senderType: "university" | "corporate" | "retail" | "newsletter" | "personal" | "system".
8. confidence: Float between 0.0 and 1.0 representing extraction confidence.
9. tags: Array of 1-3 tags from: ["Work", "Personal", "Finance", "Travel", "Newsletters", "Promotions", "Urgent", "College", "Internship", "Shopping"].
10. eventProposal: If actionType is "event", provide:
    - title: concise event title
    - startTime: ISO 8601 string (e.g. 2026-09-10T14:00:00.000Z)
    - endTime: ISO 8601 string (usually 1 hour after startTime if unspecified)
    - location: location or meeting link (Zoom, Meet, or physical)
    - description: brief context
    If not an event, set eventProposal to null.
11. taskProposal: If actionType is "task", provide:
    - title: action-oriented task name (e.g. "Submit Code2Create project proposal")
    - dueDate: ISO 8601 date/time or null
    - notes: key details needed to execute
    - priority: "low" | "medium" | "high"
    If not a task, set taskProposal to null.

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "summary": "...",
  "category": "College",
  "priority": "high",
  "requiresAction": true,
  "actionType": "task",
  "deadline": "2026-09-12",
  "senderType": "university",
  "confidence": 0.94,
  "tags": ["College", "Urgent"],
  "eventProposal": null,
  "taskProposal": { "title": "...", "dueDate": "...", "notes": "...", "priority": "high" }
}`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0.1,
        max_completion_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return only a valid JSON object matching the requested schema. Do not use markdown backticks or commentary.",
          },
          { role: "user", content: prompt },
        ],
      });

      const responseText = response.choices[0]?.message?.content?.trim() || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as any;
        const validCategories = ["College", "Internship", "Work", "Shopping", "Finance", "Travel", "Newsletters", "Promotions", "Personal"];
        const category = validCategories.includes(parsed.category) ? parsed.category : "Work";
        const validPriorities = ["critical", "high", "medium", "low", "ignore"];
        const priority = validPriorities.includes(parsed.priority) ? parsed.priority : "medium";
        const requiresAction = Boolean(parsed.requiresAction ?? parsed.isActionable);
        const actionType = ["event", "task", "none"].includes(parsed.actionType) ? parsed.actionType : (requiresAction ? "task" : "none");

        return {
          summary: parsed.summary || generateFallbackSummary(subject, body),
          category,
          priority: priority as any,
          requiresAction,
          isActionable: requiresAction,
          actionType: actionType as any,
          deadline: parsed.deadline || null,
          senderType: parsed.senderType || "corporate",
          confidence: typeof parsed.confidence === "number" ? Math.max(0.1, Math.min(1.0, parsed.confidence)) : 0.85,
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : [category],
          eventProposal: parsed.eventProposal || null,
          taskProposal: parsed.taskProposal || null,
        };
      }
    } catch (err) {
      console.warn("Groq API call failed, falling back to heuristic engine:", err);
    }
  }

  // Fallback heuristic extraction
  return heuristicEmailAnalysis(subject, sender, body, receivedAt);
}

// Temporary compatibility export for any external callers still using the old name.
export const analyzeEmailWithGemini = analyzeEmailWithGroq;

function generateFallbackSummary(subject: string, body: string): string {
  const cleanBody = body
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = cleanBody.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return `${sentences[0]} ${sentences[1]}`;
  } else if (sentences.length === 1) {
    return sentences[0];
  }
  return `Notification regarding: ${subject}.`;
}

export function heuristicEmailAnalysis(
  subject: string,
  sender: string,
  body: string,
  receivedAt: Date = new Date()
): AIAnalysisResult {
  const combined = `${subject} ${body}`.toLowerCase();
  const tags: string[] = [];

  // Categorize tags
  if (
    combined.includes("urgent") ||
    combined.includes("asap") ||
    combined.includes("immediately") ||
    combined.includes("action required") ||
    combined.includes("critical")
  ) {
    tags.push("Urgent");
  }

  if (
    combined.includes("flight") ||
    combined.includes("hotel") ||
    combined.includes("booking") ||
    combined.includes("airline") ||
    combined.includes("reservation") ||
    combined.includes("boarding pass") ||
    combined.includes("itinerary")
  ) {
    tags.push("Travel");
  }

  if (
    combined.includes("invoice") ||
    combined.includes("payment") ||
    combined.includes("receipt") ||
    combined.includes("billing") ||
    combined.includes("subscription") ||
    combined.includes("usd") ||
    combined.includes("$") ||
    combined.includes("bank")
  ) {
    tags.push("Finance");
  }

  if (
    combined.includes("newsletter") ||
    combined.includes("digest") ||
    combined.includes("weekly") ||
    combined.includes("unsubscribe")
  ) {
    tags.push("Newsletters");
  }

  if (
    combined.includes("discount") ||
    combined.includes("% off") ||
    combined.includes("sale") ||
    combined.includes("promo") ||
    combined.includes("coupon")
  ) {
    tags.push("Promotions");
  }

  if (tags.length === 0) {
    if (
      combined.includes("project") ||
      combined.includes("team") ||
      combined.includes("sync") ||
      combined.includes("meeting") ||
      combined.includes("client") ||
      combined.includes("quarterly")
    ) {
      tags.push("Work");
    } else {
      tags.push("Personal");
    }
  }

  // Detect Category
  let category = "Work";
  let senderType: "university" | "corporate" | "retail" | "newsletter" | "personal" | "system" = "corporate";

  const senderLower = sender.toLowerCase();
  if (senderLower.includes(".edu") || senderLower.includes("college") || senderLower.includes("university") || combined.includes("college") || combined.includes("assignment") || combined.includes("submission") || combined.includes("course") || combined.includes("professor") || combined.includes("syllabus") || combined.includes("code2create")) {
    category = "College";
    senderType = "university";
  } else if (combined.includes("internship") || combined.includes("offer letter") || combined.includes("interview") || combined.includes("recruiter") || combined.includes("applicant") || combined.includes("application status")) {
    category = "Internship";
    senderType = "corporate";
  } else if (combined.includes("amazon") || combined.includes("shipped") || combined.includes("delivery") || combined.includes("tracking") || combined.includes("order #") || combined.includes("package") || combined.includes("store") || combined.includes("cart")) {
    category = "Shopping";
    senderType = "retail";
  } else if (tags.includes("Travel")) {
    category = "Travel";
  } else if (tags.includes("Finance")) {
    category = "Finance";
  } else if (tags.includes("Newsletters")) {
    category = "Newsletters";
    senderType = "newsletter";
  } else if (tags.includes("Promotions")) {
    category = "Promotions";
    senderType = "retail";
  } else if (tags.includes("Personal") || senderLower.includes("family") || senderLower.includes("@gmail.com")) {
    category = "Personal";
    senderType = "personal";
  }

  // Detect Event vs Task
  const isEvent =
    combined.includes("meeting") ||
    combined.includes("calendar") ||
    combined.includes("flight") ||
    combined.includes("webinar") ||
    combined.includes("zoom.us") ||
    combined.includes("meet.google.com") ||
    combined.includes("invite") ||
    combined.includes("rsvp") ||
    combined.includes("at 10:") ||
    combined.includes("at 2:") ||
    combined.includes("at 3:") ||
    combined.includes("pm est") ||
    combined.includes("am est");

  const isTask =
    !isEvent &&
    (combined.includes("please review") ||
      combined.includes("can you") ||
      combined.includes("action item") ||
      combined.includes("deadline") ||
      combined.includes("due by") ||
      combined.includes("due on") ||
      combined.includes("due friday") ||
      combined.includes("send over") ||
      combined.includes("follow up") ||
      combined.includes("todo") ||
      combined.includes("submission") ||
      combined.includes("task"));

  const actionType: "event" | "task" | "none" = isEvent
    ? "event"
    : isTask
    ? "task"
    : tags.includes("Urgent") || tags.includes("Finance") || category === "College"
    ? "task"
    : "none";

  const isActionable = actionType !== "none";

  // Generic Priority
  let priority: "critical" | "high" | "medium" | "low" | "ignore" = "medium";
  if (tags.includes("Urgent") || combined.includes("urgent") || combined.includes("asap")) {
    priority = "critical";
  } else if (category === "Internship" || category === "College" || tags.includes("Finance") || isEvent) {
    priority = "high";
  } else if (category === "Shopping" || tags.includes("Newsletters") || tags.includes("Promotions")) {
    priority = category === "Shopping" ? "low" : "ignore";
  }

  // Deadline extraction if mentioned
  let deadline: string | null = null;
  if (combined.includes("due friday") || combined.includes("friday")) {
    const d = new Date(receivedAt);
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    deadline = d.toISOString().split("T")[0];
  } else if (combined.includes("due tomorrow") || combined.includes("tomorrow")) {
    const d = new Date(receivedAt);
    d.setDate(d.getDate() + 1);
    deadline = d.toISOString().split("T")[0];
  }

  // Event Proposal generator
  let eventProposal = null;
  if (isEvent) {
    const targetDate = new Date(receivedAt);
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(15, 0, 0, 0); // Tomorrow at 3:00 PM
    const endDate = new Date(targetDate);
    endDate.setHours(16, 0, 0, 0);

    let location = "Google Meet";
    if (combined.includes("zoom")) location = "Zoom Meeting";
    if (combined.includes("terminal") || combined.includes("airport")) location = "Airport Terminal";
    if (combined.includes("room") || combined.includes("office")) location = "Main Conference Room";

    eventProposal = {
      title: subject.replace(/^(re:|fwd:)\s*/i, "").trim(),
      startTime: targetDate.toISOString(),
      endTime: endDate.toISOString(),
      location,
      description: `Auto-extracted from email sent by ${sender}. Summary: ${generateFallbackSummary(subject, body)}`,
    };
  }

  // Task Proposal generator
  let taskProposal = null;
  if (isTask || (isActionable && !isEvent)) {
    const dueDate = new Date(receivedAt);
    dueDate.setDate(dueDate.getDate() + 2);
    dueDate.setHours(17, 0, 0, 0);

    taskProposal = {
      title: subject.replace(/^(re:|fwd:)\s*/i, "").trim(),
      dueDate: deadline ? new Date(deadline).toISOString() : dueDate.toISOString(),
      notes: `Action required from ${sender}: ${generateFallbackSummary(subject, body)}`,
      priority: (priority === "critical" || priority === "high" ? "high" : "medium") as any,
    };
  }

  return {
    summary: generateFallbackSummary(subject, body),
    category,
    priority,
    requiresAction: isActionable,
    isActionable,
    actionType,
    deadline,
    senderType,
    confidence: 0.85,
    tags,
    eventProposal,
    taskProposal,
  };
}
