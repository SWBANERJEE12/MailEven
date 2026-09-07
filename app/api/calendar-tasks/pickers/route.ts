import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGoogleCalendarLists, fetchGoogleTaskLists } from "@/lib/google";
import { decryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  try {
    const account = accountId
      ? await prisma.connectedAccount.findFirst({
          where: { id: accountId, userId },
        })
      : await prisma.connectedAccount.findFirst({
          where: { userId, isPrimary: true },
        });

    // Live Google API calendar & task list retrieval
    const plainToken = account?.accessToken
      ? decryptToken(account.accessToken) || account.accessToken
      : null;

    if (
      plainToken &&
      !plainToken.startsWith("demo_") &&
      process.env.GOOGLE_CLIENT_ID
    ) {
      const [calendars, taskLists] = await Promise.all([
        fetchGoogleCalendarLists(account!.accessToken!, account!.refreshToken || undefined),
        fetchGoogleTaskLists(account!.accessToken!, account!.refreshToken || undefined),
      ]);
      return NextResponse.json({ calendars, taskLists });
    }

    // Demo / fallback lists
    const isWork = account?.email?.includes("work") ?? true;
    const demoCalendars = isWork
      ? [
          { id: "primary", summary: "Primary (Work)", primary: true },
          { id: "team_syncs", summary: "Executive & Team Syncs", primary: false },
          { id: "investor_cal", summary: "Board & Investor Relations", primary: false },
        ]
      : [
          { id: "primary", summary: "Primary (Personal)", primary: true },
          { id: "family_events", summary: "Family & Social", primary: false },
        ];

    const demoTaskLists = isWork
      ? [
          { id: "@default", title: "My Tasks (Action Items)" },
          { id: "product_roadmap", title: "Q3 Product Deliverables" },
        ]
      : [
          { id: "@default", title: "Personal To-Do" },
          { id: "travel_prep", title: "Travel & Reservations" },
        ];

    return NextResponse.json({
      calendars: demoCalendars,
      taskLists: demoTaskLists,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
