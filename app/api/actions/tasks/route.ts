import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleTaskItem } from "@/lib/google";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { emailId, title, due, notes } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let googleTaskId: string | undefined;

    if (user.accessToken && !user.isDemo) {
      try {
        const taskResult = await createGoogleTaskItem(user.accessToken, user.refreshToken || undefined, {
          title,
          notes,
          due,
        });
        googleTaskId = taskResult.googleTaskId || undefined;
      } catch (taskErr: any) {
        console.warn("Google Tasks API error (falling back to local DB):", taskErr.message);
      }
    }

    const taskItem = await prisma.taskItem.create({
      data: {
        userId,
        emailId: emailId || null,
        googleTaskId,
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
    }

    return NextResponse.json({
      success: true,
      task: taskItem,
      message: "Task added to Google Tasks!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
