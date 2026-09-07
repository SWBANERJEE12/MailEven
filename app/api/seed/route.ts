import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEMO_ACCOUNTS, INITIAL_MOCK_EMAILS } from "@/lib/mock-data";
import { encryptToken } from "@/lib/crypto";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

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

    // Ensure both demo connected accounts exist
    const accountMap = new Map<string, string>();

    for (const demoAcc of DEMO_ACCOUNTS) {
      const dbAcc = await prisma.connectedAccount.upsert({
        where: {
          userId_email: {
            userId,
            email: demoAcc.email,
          },
        },
        update: {
          name: demoAcc.name,
          color: demoAcc.color,
          initials: demoAcc.initials,
          isPrimary: demoAcc.isPrimary,
        },
        create: {
          userId,
          email: demoAcc.email,
          name: demoAcc.name,
          color: demoAcc.color,
          initials: demoAcc.initials,
          isPrimary: demoAcc.isPrimary,
          accessToken: encryptToken("demo_access_" + demoAcc.id),
          refreshToken: encryptToken("demo_refresh_" + demoAcc.id),
        },
      });
      accountMap.set(demoAcc.id, dbAcc.id);
    }

    // Insert mock emails linked to their accounts
    for (const mock of INITIAL_MOCK_EMAILS) {
      const connectedAccId = accountMap.get(mock.accountId);
      const existing = await prisma.email.findFirst({
        where: { userId, googleMessageId: mock.id },
      });

      if (!existing) {
        await prisma.email.create({
          data: {
            userId,
            connectedAccountId: connectedAccId || null,
            accountEmail: mock.accountEmail,
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
        title: "Mock Dataset Refreshed",
        message: "Dual accounts synced: Alex Chen (Work) and Alex Chen (Personal). Interleaved feed active.",
        summary: "Ready to explore Inbox, Daily Briefing, and One-Tap Calendar & Tasks actions.",
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dual demo accounts and sample emails successfully seeded.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
