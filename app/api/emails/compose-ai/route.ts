import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGroqClient } from "@/lib/groq";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, prompt, currentSubject, currentBody, tone = "executive" } = await req.json();

    const groqKey = process.env.GROQ_API_KEY?.trim();

    if (groqKey) {
      try {
        const groq = createGroqClient(groqKey);
        const toneGuide = {
          executive: "direct, high-signal, confident, and professional",
          concise: "ultra-concise, under 3-4 sentences, minimal fluff, action-oriented",
          friendly: "warm, collaborative, polite, and encouraging",
          formal: "traditional, articulate, dignified business correspondence",
        }[tone as "executive" | "concise" | "friendly" | "formal"] || "crisp and professional";

        let systemPrompt = "";
        let userPrompt = "";

        if (action === "draft") {
          systemPrompt = `You are an elite executive assistant drafting an email. 
Tone: ${toneGuide}.
Respond ONLY with a JSON object: {"subject": "...", "body": "..."}. Do not include markdown codeblocks or extra text.`;
          userPrompt = `Draft an email based on this instruction/intent:\n"${prompt || "Check in on project progress and request a quick update."}"`;
        } else if (action === "polish") {
          systemPrompt = `You are an elite executive communication coach rewriting and polishing an email draft.
Tone: ${toneGuide}.
Enhance clarity, remove unnecessary words, and ensure the message delivers its key outcome smoothly.
Respond ONLY with a JSON object: {"subject": "...", "body": "..."}. Do not include markdown codeblocks or extra text.`;
          userPrompt = `Current Subject: ${currentSubject || "(none)"}\n\nCurrent Body:\n${currentBody || ""}\n\nRewrite this to be ${toneGuide}.`;
        } else if (action === "reply") {
          systemPrompt = `You are an elite executive assistant drafting a reply to an incoming email.
Tone: ${toneGuide}.
Respond ONLY with a JSON object: {"subject": "...", "body": "..."}. Do not include markdown codeblocks or extra text.`;
          userPrompt = `Incoming email subject: ${currentSubject}\nIncoming email content: ${currentBody}\nUser instruction: ${prompt || "Acknowledge and agree or request further info."}`;
        }

        const response = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          max_completion_tokens: 800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const content = response.choices[0]?.message?.content?.trim() || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            subject: parsed.subject || currentSubject || "Follow up",
            body: parsed.body || currentBody,
          });
        }
      } catch (apiErr) {
        console.warn("Groq AI compose failed, using local fallback generator:", apiErr);
      }
    }

    // Local fallback generator when no API key or offline
    const fallbackResult = generateLocalDraft(action, prompt, currentSubject, currentBody, tone);
    return NextResponse.json(fallbackResult);
  } catch (error: any) {
    console.error("Compose AI error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI draft" }, { status: 500 });
  }
}

function generateLocalDraft(
  action: string,
  prompt?: string,
  currentSubject?: string,
  currentBody?: string,
  tone: string = "executive"
) {
  const p = (prompt || "").trim();
  const sub = currentSubject?.trim() || "Follow up & Project Discussion";
  const body = currentBody?.trim() || "";

  if (action === "polish") {
    if (tone === "concise") {
      const firstLines = body.split("\n").filter(Boolean).slice(0, 3).join(" ");
      return {
        subject: currentSubject || "Quick Update",
        body: firstLines
          ? `Hi,\n\n${firstLines}\n\nLet me know if you need anything else.\n\nBest,\nAlex`
          : "Hi,\n\nFollowing up on our earlier discussion. Looking forward to your thoughts.\n\nBest,\nAlex",
      };
    }
    if (tone === "formal") {
      return {
        subject: currentSubject || "Formal Notification",
        body: `Dear recipient,\n\nI am writing to provide an update regarding our recent correspondence.\n\n${body || "Please let me know if there are any specific items you would like to review."}\n\nThank you for your time and consideration.\n\nSincerely,\nAlex Chen`,
      };
    }
    if (tone === "friendly") {
      return {
        subject: currentSubject || "Checking in!",
        body: `Hi there!\n\nHope you're having a great week! Just wanted to quickly connect regarding:\n\n${body || "our upcoming plans and next steps."}\n\nWould love to hear your thoughts whenever you have a moment!\n\nCheers,\nAlex`,
      };
    }
    // Executive
    return {
      subject: currentSubject || "Next Steps & Update",
      body: `Hi,\n\nKey updates regarding our ongoing priorities:\n\n${body || "• Please review the latest deliverables\n• Let me know if any blockers arise"}\n\nLooking forward to aligning on this.\n\nBest regards,\nAlex Chen`,
    };
  }

  // Draft action
  if (p.toLowerCase().includes("meet") || p.toLowerCase().includes("sync") || p.toLowerCase().includes("schedule")) {
    return {
      subject: "Invitation: Discussion & Alignment Sync",
      body: `Hi,\n\nI'd like to schedule some time for us to connect regarding ${p || "our upcoming initiatives"}.\n\nWould you be available for a brief 20-minute sync later this week? Please let me know what times work best on your calendar.\n\nLooking forward to speaking.\n\nBest regards,\nAlex Chen`,
    };
  }

  if (p.toLowerCase().includes("update") || p.toLowerCase().includes("status")) {
    return {
      subject: "Project Status & Progress Update",
      body: `Hi team,\n\nHere is a quick summary regarding our current progress on ${p || "the project"}:\n\n1. Milestones completed on schedule\n2. Next focus areas underway\n3. No critical blockers identified\n\nPlease let me know if you have any questions or feedback.\n\nBest,\nAlex Chen`,
    };
  }

  return {
    subject: p.length > 0 && p.length < 50 ? p : "Following up: Important Update",
    body: `Hi,\n\nI am reaching out regarding ${p || "our latest progress"}.\n\nPlease let me know your thoughts or if we need to discuss further.\n\nBest regards,\nAlex Chen`,
  };
}
