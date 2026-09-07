import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const email = await prisma.email.findUnique({
      where: { id: params.id },
      include: {
        calendarEvents: true,
        tasks: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: {
        ...email,
        tags: JSON.parse(email.tags || "[]"),
        eventProposal: email.eventProposal ? JSON.parse(email.eventProposal) : null,
        taskProposal: email.taskProposal ? JSON.parse(email.taskProposal) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
