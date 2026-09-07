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
    const notifications = await prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notificationLog.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notificationLog.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
