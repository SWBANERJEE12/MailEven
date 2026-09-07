import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";
import { revokeGoogleToken } from "@/lib/google";
import { decryptToken } from "@/lib/crypto";

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
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const account = await prisma.connectedAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // 1. Revoke token server-side with Google OAuth endpoint if refreshToken exists
    if (account.refreshToken) {
      const plainToken = decryptToken(account.refreshToken);
      if (plainToken && !plainToken.startsWith("demo_")) {
        try {
          await revokeGoogleToken(plainToken);
        } catch (revokeErr) {
          console.warn("Failed to revoke token at Google:", revokeErr);
        }
      }
    }

    // 2. Delete associated emails, calendar events, and tasks for this connected account
    await prisma.calendarEvent.deleteMany({
      where: { userId, connectedAccountId: accountId },
    });

    await prisma.taskItem.deleteMany({
      where: { userId, connectedAccountId: accountId },
    });

    await prisma.email.deleteMany({
      where: { userId, connectedAccountId: accountId },
    });

    // 3. Delete the connected account record
    await prisma.connectedAccount.delete({
      where: { id: accountId },
    });

    // 4. If deleted account was primary, reassign primary to remaining account if any
    if (account.isPrimary) {
      const nextRemaining = await prisma.connectedAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (nextRemaining) {
        await prisma.connectedAccount.update({
          where: { id: nextRemaining.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Account ${account.email} revoked and its local records purged.`,
    });
  } catch (error: any) {
    console.error("Account revoke error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
