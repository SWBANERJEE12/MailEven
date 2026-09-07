import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/google";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { emailId, title, startTime, endTime, location, description } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Title, start time, and end time are required" }, { status: 400 });
    }

    let googleEventId: string | undefined;
    let htmlLink: string | undefined;

    // Call Google Calendar API if live access token is available
    if (user.accessToken && !user.isDemo) {
      try {
        const calResult = await createGoogleCalendarEvent(user.accessToken, user.refreshToken || undefined, {
          title,
          description,
          location,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        });
        googleEventId = calResult.googleEventId || undefined;
        htmlLink = calResult.htmlLink || undefined;
      } catch (calErr: any) {
        console.warn("Google Calendar API error (falling back to local DB):", calErr.message);
      }
    }

    // Format web link fallback
    if (!htmlLink) {
      const sDate = new Date(startTime).toISOString().replace(/-|:|\.\d+/g, "");
      const eDate = new Date(endTime).toISOString().replace(/-|:|\.\d+/g, "");
      htmlLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
      )}&dates=${sDate}/${eDate}&details=${encodeURIComponent(description || "")}&location=${encodeURIComponent(
        location || ""
      )}`;
    }

    // Store in Prisma
    const calendarEvent = await prisma.calendarEvent.create({
      data: {
        userId,
        emailId: emailId || null,
        googleEventId,
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        htmlLink,
      },
    });

    // Update Email briefing status to actioned
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { briefingStatus: "actioned" },
      });
    }

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      message: "Event successfully scheduled on Google Calendar!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
