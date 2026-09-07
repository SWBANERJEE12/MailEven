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
    const briefingEmails = await prisma.email.findMany({
      where: {
        userId,
        isActionable: true,
        briefingStatus: "pending",
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emailId, action } = await req.json();

    if (!emailId || !["dismiss", "interested"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const updated = await prisma.email.update({
      where: { id: emailId },
      data: {
        briefingStatus: action === "dismiss" ? "dismissed" : "interested",
      },
    });

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
