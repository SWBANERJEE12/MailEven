import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { retentionDays: true },
    });

    const totalEmails = await prisma.email.count({ where: { userId } });
    const rawBodiesStored = await prisma.email.count({
      where: {
        userId,
        bodyText: { not: null },
      },
    });
    const purgedBodiesCount = await prisma.email.count({
      where: {
        userId,
        bodyPurgedAt: { not: null },
      },
    });

    return NextResponse.json({
      retentionDays: user?.retentionDays ?? 30,
      totalEmails,
      rawBodiesStored,
      purgedBodiesCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const body = await req.json().catch(() => ({}));
    const days = typeof body.days === "number" ? body.days : 30;

    // Save preference if requested
    if (body.updateSetting) {
      await prisma.user.update({
        where: { id: userId },
        data: { retentionDays: days },
      });
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.email.updateMany({
      where: {
        userId,
        receivedAt: { lt: cutoffDate },
        bodyText: { not: null },
      },
      data: {
        bodyText: null,
        bodyHtml: null,
        bodyPurgedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      purgedCount: result.count,
      message: `Auto-purged raw bodies from ${result.count} email(s) older than ${days} days. Summaries, tags, and action items preserved.`,
    });
  } catch (error: any) {
    console.error("Purge error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
