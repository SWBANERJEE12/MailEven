import { GoogleGenAI } from "@google/genai";

export interface AIAnalysisResult {
  summary: string;
  tags: string[];
  isActionable: boolean;
  actionType: "event" | "task" | "none";
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

export async function analyzeEmailWithGemini(
  subject: string,
  sender: string,
  body: string,
  receivedAt: Date = new Date()
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini API Key is configured, attempt real Gemini 2.5 Flash inference
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the AI core for MailEven, an executive email assistant.
Analyze this email and extract structured actions, tags, and a crisp summary.

EMAIL METADATA:
- Sender: ${sender}
- Subject: ${subject}
- Received Time: ${receivedAt.toISOString()}
- Email Body:
"""
${body.slice(0, 4000)}
"""

REQUIREMENTS:
1. summary: A crisp 1-2 sentence summary capturing the key context and why it matters.
2. tags: Array of 1-3 tags from: ["Work", "Personal", "Finance", "Travel", "Newsletters", "Promotions", "Urgent"].
3. isActionable: boolean. True if the email requires calendar scheduling, RSVP, reply, task completion, or deadline follow-up.
4. actionType: "event" (if it contains a meeting, flight, reservation, webinar, call with a specific time), "task" (if it contains action items, requests, deadlines, review requests), or "none".
5. eventProposal: If actionType is "event", provide:
   - title: concise event title
   - startTime: ISO 8601 string (e.g. 2026-09-10T14:00:00.000Z)
   - endTime: ISO 8601 string (usually 1 hour after startTime if unspecified)
   - location: location or meeting link (Zoom, Meet, or physical)
   - description: brief context
   If not an event, set eventProposal to null.
6. taskProposal: If actionType is "task", provide:
   - title: action-oriented task name (e.g. "Review Q3 financial deck")
   - dueDate: ISO 8601 date/time or null
   - notes: key details needed to execute
   - priority: "low" | "medium" | "high"
   If not a task, set taskProposal to null.

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "summary": "...",
  "tags": ["..."],
  "isActionable": true,
  "actionType": "event" | "task" | "none",
  "eventProposal": null | { "title": "...", "startTime": "...", "endTime": "...", "location": "...", "description": "..." },
  "taskProposal": null | { "title": "...", "dueDate": "...", "notes": "...", "priority": "medium" }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const responseText = response.text?.trim() || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
        return {
          summary: parsed.summary || generateFallbackSummary(subject, body),
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : ["Work"],
          isActionable: Boolean(parsed.isActionable),
          actionType: ["event", "task", "none"].includes(parsed.actionType) ? parsed.actionType : "none",
          eventProposal: parsed.eventProposal || null,
          taskProposal: parsed.taskProposal || null,
        };
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to heuristic engine:", err);
    }
  }

  // Fallback heuristic extraction
  return heuristicEmailAnalysis(subject, sender, body, receivedAt);
}

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
      combined.includes("send over") ||
      combined.includes("follow up") ||
      combined.includes("todo") ||
      combined.includes("task"));

  const actionType: "event" | "task" | "none" = isEvent
    ? "event"
    : isTask
    ? "task"
    : tags.includes("Urgent") || tags.includes("Finance")
    ? "task"
    : "none";

  const isActionable = actionType !== "none";

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
      dueDate: dueDate.toISOString(),
      notes: `Action required from ${sender}: ${generateFallbackSummary(subject, body)}`,
      priority: tags.includes("Urgent") ? ("high" as const) : ("medium" as const),
    };
  }

  return {
    summary: generateFallbackSummary(subject, body),
    tags,
    isActionable,
    actionType,
    eventProposal,
    taskProposal,
  };
}
