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
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  try {
    const whereClause: any = {
      userId,
      isActionable: true,
      briefingStatus: "pending",
    };

    if (accountId && accountId !== "all") {
      whereClause.OR = [
        { connectedAccountId: accountId },
        { accountEmail: accountId },
      ];
    }

    const briefingEmails = await prisma.email.findMany({
      where: whereClause,
      include: {
        connectedAccount: {
          select: {
            id: true,
            email: true,
            name: true,
            initials: true,
            color: true,
            isPrimary: true,
          },
        },
      },
      orderBy: {
        receivedAt: "desc",
      },
    });

    const parsed = briefingEmails.map((e) => ({
      ...e,
      tags: JSON.parse(e.tags || "[]"),
      eventProposal: e.eventProposal ? JSON.parse(e.eventProposal) : null,
      taskProposal: e.taskProposal ? JSON.parse(e.taskProposal) : null,
    }));

    return NextResponse.json({ items: parsed });
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
    const { emailId, action } = await req.json();

    if (!emailId || !["dismiss", "interested"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const email = await prisma.email.findFirst({
      where: { id: emailId, userId },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const updated = await prisma.email.update({
      where: { id: emailId },
      data: {
        briefingStatus: action === "dismiss" ? "dismissed" : "interested",
      },
    });

    // Record implicit feedback on dismissal
    if (action === "dismiss") {
      try {
        const { recordImplicitDismissal } = await import("@/lib/personalization");
        await recordImplicitDismissal(userId, emailId, email.category || "General", email.sender);
      } catch (fbErr) {
        console.warn("Could not record implicit dismissal feedback:", fbErr);
      }
    }

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
