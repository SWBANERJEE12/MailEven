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
  const { searchParams } = new URL(req.url);
  const tagFilter = searchParams.get("tag");
  const searchQuery = searchParams.get("search")?.toLowerCase().trim();
  const status = searchParams.get("status") || "inbox";

  try {
    const emails = await prisma.email.findMany({
      where: {
        userId,
        status: status === "all" ? undefined : status,
      },
      orderBy: {
        receivedAt: "desc",
      },
    });

    let filtered = emails.map((e) => ({
      ...e,
      tags: JSON.parse(e.tags || "[]") as string[],
      eventProposal: e.eventProposal ? JSON.parse(e.eventProposal) : null,
      taskProposal: e.taskProposal ? JSON.parse(e.taskProposal) : null,
    }));

    if (tagFilter && tagFilter !== "All") {
      filtered = filtered.filter((e) => e.tags.includes(tagFilter));
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.subject.toLowerCase().includes(searchQuery) ||
          e.sender.toLowerCase().includes(searchQuery) ||
          (e.senderName && e.senderName.toLowerCase().includes(searchQuery)) ||
          e.summary.toLowerCase().includes(searchQuery) ||
          (e.snippet && e.snippet.toLowerCase().includes(searchQuery))
      );
    }

    return NextResponse.json({ emails: filtered });
  } catch (error: any) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { emailId, status, isRead, briefingStatus } = body;

    const updated = await prisma.email.update({
      where: { id: emailId },
      data: {
        ...(status !== undefined && { status }),
        ...(isRead !== undefined && { isRead }),
        ...(briefingStatus !== undefined && { briefingStatus }),
      },
    });

    return NextResponse.json({ email: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
