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
    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
      include: {
        email: {
          select: { id: true, subject: true, senderName: true, sender: true },
        },
      },
    });

    const tasks = await prisma.taskItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        email: {
          select: { id: true, subject: true, senderName: true, sender: true },
        },
      },
    });

    return NextResponse.json({ events, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskId, isCompleted } = await req.json();

    const updated = await prisma.taskItem.update({
      where: { id: taskId },
      data: {
        isCompleted,
        status: isCompleted ? "completed" : "needsAction",
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
