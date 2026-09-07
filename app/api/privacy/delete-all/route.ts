import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function DELETE(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Delete all local records for the user
    await prisma.calendarEvent.deleteMany({ where: { userId } });
    await prisma.taskItem.deleteMany({ where: { userId } });
    await prisma.notificationLog.deleteMany({ where: { userId } });
    await prisma.email.deleteMany({ where: { userId } });

    return NextResponse.json({
      success: true,
      message: "All local email, calendar, and task records have been permanently deleted.",
    });
  } catch (error: any) {
    console.error("Delete all data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
