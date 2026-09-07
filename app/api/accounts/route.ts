import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";
import { encryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        color: true,
        initials: true,
        isPrimary: true,
        createdAt: true,
        _count: {
          select: {
            emails: true,
            calendarEvents: true,
            tasks: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Failed to fetch connected accounts:", error);
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
    const body = await req.json();
    const { email, name, color, initials } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const computedInitials =
      initials ||
      (name
        ? name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : email[0].toUpperCase());

    const account = await prisma.connectedAccount.create({
      data: {
        userId,
        email,
        name: name || email.split("@")[0],
        initials: computedInitials,
        color: color || "#4F6B6E",
        isPrimary: false,
        accessToken: encryptToken("demo_token_" + Date.now()),
        refreshToken: encryptToken("demo_refresh_" + Date.now()),
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
