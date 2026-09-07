import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INITIAL_MOCK_EMAILS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { action } = await req.json().catch(() => ({ action: "seed" }));

    if (action === "reset") {
      await prisma.calendarEvent.deleteMany({ where: { userId } });
      await prisma.taskItem.deleteMany({ where: { userId } });
      await prisma.notificationLog.deleteMany({ where: { userId } });
      await prisma.email.deleteMany({ where: { userId } });
    }

    // Insert mock emails
    for (const mock of INITIAL_MOCK_EMAILS) {
      const existing = await prisma.email.findFirst({
        where: { userId, googleMessageId: mock.id },
      });

      if (!existing) {
        await prisma.email.create({
          data: {
            userId,
            googleMessageId: mock.id,
            threadId: mock.id,
            sender: mock.sender,
            senderName: mock.senderName,
            recipient: mock.recipient,
            subject: mock.subject,
            snippet: mock.snippet,
            bodyText: mock.bodyText,
            receivedAt: new Date(mock.receivedAt),
            summary: mock.summary,
            isActionable: mock.isActionable,
            actionType: mock.actionType,
            eventProposal: mock.eventProposal ? JSON.stringify(mock.eventProposal) : null,
            taskProposal: mock.taskProposal ? JSON.stringify(mock.taskProposal) : null,
            tags: JSON.stringify(mock.tags),
            briefingStatus: mock.briefingStatus,
            isMock: true,
          },
        });
      }
    }

    await prisma.notificationLog.create({
      data: {
        userId,
        title: "Mock Data Seeded",
        message: "Your inbox has been refreshed with sample executive emails, AI summaries, and actionable briefings.",
        summary: "Ready to explore Inbox, Daily Briefing, and One-Tap Calendar & Tasks actions.",
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, message: "Sample emails successfully seeded." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
