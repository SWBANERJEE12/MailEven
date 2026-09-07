import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/google";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Rate limit: 20 confirm actions per 60s
  const rateLimit = checkRateLimit(`action:${userId}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Action rate limit reached. Please wait a few seconds before creating another calendar event.",
        resetInSeconds: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) },
      }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { connectedAccounts: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { emailId, title, startTime, endTime, location, description, calendarId } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Title, start time, and end time are required" }, { status: 400 });
    }

    // Find associated email to determine connected account
    let connectedAccountId: string | null = null;
    if (emailId) {
      const emailRecord = await prisma.email.findFirst({
        where: { id: emailId, userId },
      });
      if (emailRecord?.connectedAccountId) {
        connectedAccountId = emailRecord.connectedAccountId;
      }
    }

    // Locate target account tokens
    const targetAccount = connectedAccountId
      ? user.connectedAccounts.find((a) => a.id === connectedAccountId)
      : user.connectedAccounts.find((a) => a.isPrimary) || user.connectedAccounts[0];

    let googleEventId: string | undefined;
    let htmlLink: string | undefined;

    // Call Google Calendar API if live access token is available
    if (
      targetAccount?.accessToken &&
      !targetAccount.accessToken.startsWith("demo_") &&
      !user.isDemo
    ) {
      try {
        const calResult = await createGoogleCalendarEvent(
          targetAccount.accessToken,
          targetAccount.refreshToken || undefined,
          {
            title,
            description,
            location,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            calendarId: calendarId || "primary",
          }
        );
        googleEventId = calResult.googleEventId || undefined;
        htmlLink = calResult.htmlLink || undefined;
      } catch (calErr: any) {
        console.warn("Google Calendar API error (falling back to web link):", calErr.message);
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
        connectedAccountId: targetAccount?.id || null,
        emailId: emailId || null,
        googleEventId,
        calendarId: calendarId || "primary",
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

      // Record implicit feedback: user scheduled a calendar event
      try {
        const emailRecord = await prisma.email.findUnique({ where: { id: emailId } });
        if (emailRecord) {
          const { recordImplicitCalendarCreation } = await import("@/lib/personalization");
          await recordImplicitCalendarCreation(userId, emailId, emailRecord.category || "General", emailRecord.sender);
        }
      } catch (fbErr) {
        console.warn("Could not record implicit calendar feedback:", fbErr);
      }
    }

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      message: `Event successfully scheduled on ${calendarId ? `"${calendarId}"` : "Google Calendar"}!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
