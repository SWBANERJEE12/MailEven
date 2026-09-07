import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroqClient } from "@/lib/groq";

export interface AISummaryResponse {
  period: "today" | "week";
  overview: string;
  emailCount: number;
  actionableCount: number;
  eventCount: number;
  taskCount: number;
  highlights: {
    id: string;
    emailId: string;
    title: string;
    type: "urgent" | "event" | "task" | "finance" | "update";
    description: string;
    sender: string;
    senderName?: string | null;
    accountEmail?: string | null;
    time: string;
    actionType: "event" | "task" | "none";
    eventProposal?: any;
    taskProposal?: any;
  }[];
  categories: { name: string; count: number }[];
  topSenders: { name: string; count: number }[];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") === "week" ? "week" : "today";
  const accountId = searchParams.get("accountId");

  // Determine date boundary
  const now = new Date();
  let startDate = new Date();
  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else {
    // 7 days ago
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  }

  try {
    const whereClause: any = {
      userId,
      receivedAt: { gte: startDate },
    };

    if (accountId && accountId !== "all") {
      whereClause.OR = [
        { connectedAccountId: accountId },
        { accountEmail: accountId },
      ];
    }

    let emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        connectedAccount: {
          select: {
            id: true,
            email: true,
            name: true,
            initials: true,
            color: true,
          },
        },
      },
      orderBy: { receivedAt: "desc" },
    });

    // If no emails found strictly in today/week window, fallback to recent emails so demo & new accounts always show valuable summary
    if (emails.length === 0) {
      const fallbackWhere: any = { userId };
      if (accountId && accountId !== "all") {
        fallbackWhere.OR = [
          { connectedAccountId: accountId },
          { accountEmail: accountId },
        ];
      }
      emails = await prisma.email.findMany({
        where: fallbackWhere,
        take: period === "today" ? 5 : 12,
        include: {
          connectedAccount: {
            select: {
              id: true,
              email: true,
              name: true,
              initials: true,
              color: true,
            },
          },
        },
        orderBy: { receivedAt: "desc" },
      });
    }

    const emailCount = emails.length;
    let actionableCount = 0;
    let eventCount = 0;
    let taskCount = 0;

    const categoryMap: Record<string, number> = {};
    const senderMap: Record<string, number> = {};

    const parsedEmails = emails.map((e) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(e.tags || "[]");
      } catch {
        tags = [];
      }

      let eventProposal = null;
      let taskProposal = null;
      try {
        if (e.eventProposal) eventProposal = JSON.parse(e.eventProposal);
        if (e.taskProposal) taskProposal = JSON.parse(e.taskProposal);
      } catch {}

      if (e.isActionable) actionableCount++;
      if (e.actionType === "event") eventCount++;
      if (e.actionType === "task") taskCount++;

      tags.forEach((t) => {
        categoryMap[t] = (categoryMap[t] || 0) + 1;
      });

      const senderDisplay = e.senderName || e.sender;
      senderMap[senderDisplay] = (senderMap[senderDisplay] || 0) + 1;

      return {
        ...e,
        parsedTags: tags,
        parsedEventProposal: eventProposal,
        parsedTaskProposal: taskProposal,
      };
    });

    // Build categories array
    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Build top senders
    const topSenders = Object.entries(senderMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Build structured highlights
    const highlights = parsedEmails.slice(0, 8).map((em, idx) => {
      let highlightType: "urgent" | "event" | "task" | "finance" | "update" = "update";
      if (em.parsedTags.includes("Urgent")) highlightType = "urgent";
      else if (em.actionType === "event") highlightType = "event";
      else if (em.actionType === "task") highlightType = "task";
      else if (em.parsedTags.includes("Finance")) highlightType = "finance";

      return {
        id: `hl_${em.id}_${idx}`,
        emailId: em.id,
        title: em.subject,
        type: highlightType,
        description: em.summary || em.snippet || "Actionable communication.",
        sender: em.sender,
        senderName: em.senderName,
        accountEmail: em.accountEmail || em.connectedAccount?.email,
        time: em.receivedAt.toISOString(),
        actionType: em.actionType as "event" | "task" | "none",
        eventProposal: em.parsedEventProposal,
        taskProposal: em.parsedTaskProposal,
      };
    });

    // Generate executive overview synthesis
    let overview = "";
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (apiKey && emailCount > 0) {
      try {
        const groq = createGroqClient(apiKey);
        const emailBriefs = parsedEmails.slice(0, 8).map(
          (m) => `[${m.accountEmail || "Account"}] From: ${m.senderName || m.sender}, Subject: "${m.subject}", Summary: "${m.summary}", Action: ${m.actionType}`
        ).join("\n");

        const prompt = `You are the executive AI chief-of-staff for MailEven. 
Synthesize a crisp, high-level 2-3 sentence executive briefing for the user's ${period === "today" ? "today's" : "this week's"} incoming mail.
Focus on primary themes, urgent decisions, and actionable commitments across their connected accounts.

Emails:
${emailBriefs}

Return ONLY the 2-3 sentence overview text. No bullet points or markdown intro.`;

        const aiRes = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          temperature: 0.2,
          max_completion_tokens: 250,
          messages: [{ role: "user", content: prompt }],
        });

        overview = aiRes.choices[0]?.message?.content?.trim() || "";
      } catch (aiErr) {
        console.warn("Groq summary generation failed, using heuristic summary:", aiErr);
      }
    }

    if (!overview) {
      if (emailCount === 0) {
        overview = `No incoming emails recorded for ${period === "today" ? "today" : "this week"}. Your connected accounts are currently clear of pending correspondence.`;
      } else {
        const urgentCount = parsedEmails.filter((e) => e.parsedTags.includes("Urgent")).length;
        overview = `Across your connected accounts, you received ${emailCount} email${emailCount === 1 ? "" : "s"} ${period === "today" ? "today" : "this week"}. MailEven identified ${actionableCount} actionable item${actionableCount === 1 ? "" : "s"} (${eventCount} calendar event${eventCount === 1 ? "" : "s"} and ${taskCount} task${taskCount === 1 ? "" : "s"})${urgentCount > 0 ? ` with ${urgentCount} flagged as urgent` : ""}. Key themes center on ${categories.slice(0, 3).map((c) => c.name).join(", ") || "executive correspondence"}.`;
      }
    }

    const payload: AISummaryResponse = {
      period,
      overview,
      emailCount,
      actionableCount,
      eventCount,
      taskCount,
      highlights,
      categories,
      topSenders,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("AI Summary error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
