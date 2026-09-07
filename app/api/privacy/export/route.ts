import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isDemo: true,
        retentionDays: true,
        createdAt: true,
      },
    });

    const accounts = await prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        name: true,
        isPrimary: true,
        initials: true,
        color: true,
        createdAt: true,
      },
    });

    const emails = await prisma.email.findMany({
      where: { userId },
      select: {
        id: true,
        connectedAccountId: true,
        accountEmail: true,
        sender: true,
        senderName: true,
        recipient: true,
        subject: true,
        snippet: true,
        bodyText: true,
        receivedAt: true,
        summary: true,
        isActionable: true,
        actionType: true,
        eventProposal: true,
        taskProposal: true,
        tags: true,
        status: true,
        briefingStatus: true,
        isRead: true,
        bodyPurgedAt: true,
        createdAt: true,
      },
    });

    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      select: {
        id: true,
        connectedAccountId: true,
        calendarId: true,
        title: true,
        description: true,
        location: true,
        startTime: true,
        endTime: true,
        htmlLink: true,
        createdAt: true,
      },
    });

    const tasks = await prisma.taskItem.findMany({
      where: { userId },
      select: {
        id: true,
        connectedAccountId: true,
        taskListId: true,
        title: true,
        notes: true,
        due: true,
        status: true,
        isCompleted: true,
        createdAt: true,
      },
    });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      app: "MailEven AI Client",
      version: "Phase 2",
      user,
      connectedAccounts: accounts,
      emails,
      calendarEvents: events,
      tasks,
    };

    const dateStr = new Date().toISOString().split("T")[0];
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="maileven-export-${dateStr}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
