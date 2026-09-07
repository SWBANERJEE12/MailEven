import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleTaskItem } from "@/lib/google";
import { checkRateLimit } from "@/lib/rate-limit";
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

  // Rate limit: 20 confirm actions per 60s
  const rateLimit = checkRateLimit(`action:${userId}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Action rate limit reached. Please wait a few seconds before creating another task.",
        resetInSeconds: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) },
      }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { connectedAccounts: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { emailId, title, due, notes, taskListId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Find associated email to determine connected account
    let connectedAccountId: string | null = null;
    if (emailId) {
      const emailRecord = await prisma.email.findFirst({
        where: { id: emailId, userId },
      });
      if (emailRecord?.connectedAccountId) {
        connectedAccountId = emailRecord.connectedAccountId;
      }
    }

    const targetAccount = connectedAccountId
      ? user.connectedAccounts.find((a) => a.id === connectedAccountId)
      : user.connectedAccounts.find((a) => a.isPrimary) || user.connectedAccounts[0];

    let googleTaskId: string | undefined;

    if (
      targetAccount?.accessToken &&
      !targetAccount.accessToken.startsWith("demo_") &&
      !user.isDemo
    ) {
      try {
        const taskResult = await createGoogleTaskItem(
          targetAccount.accessToken,
          targetAccount.refreshToken || undefined,
          {
            title,
            notes,
            due,
            taskListId: taskListId || "@default",
          }
        );
        googleTaskId = taskResult.googleTaskId || undefined;
      } catch (taskErr: any) {
        console.warn("Google Tasks API error (falling back to local DB):", taskErr.message);
      }
    }

    const taskItem = await prisma.taskItem.create({
      data: {
        userId,
        connectedAccountId: targetAccount?.id || null,
        emailId: emailId || null,
        googleTaskId,
        taskListId: taskListId || "@default",
        title,
        notes,
        due: due ? new Date(due) : null,
        status: "needsAction",
        isCompleted: false,
      },
    });

    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { briefingStatus: "actioned" },
      });

      // Record implicit feedback: user chose to create a task for this email
      try {
        const emailRecord = await prisma.email.findUnique({ where: { id: emailId } });
        if (emailRecord) {
          const { recordImplicitTaskCreation } = await import("@/lib/personalization");
          await recordImplicitTaskCreation(userId, emailId, emailRecord.category || "General", emailRecord.sender);
        }
      } catch (fbErr) {
        console.warn("Could not record implicit task feedback:", fbErr);
      }
    }

    return NextResponse.json({
      success: true,
      task: taskItem,
      message: `Task added to ${taskListId ? `"${taskListId}"` : "Google Tasks"}!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
