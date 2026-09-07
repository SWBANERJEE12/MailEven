import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentGmailMessages } from "@/lib/google";
import { analyzeEmailWithGemini } from "@/lib/gemini";
import { sendNotificationToUser } from "@/lib/notifications";

const SIMULATED_INCOMING_TEMPLATES = [
  {
    sender: "marcus.vance@acme-ventures.com",
    senderName: "Marcus Vance",
    subject: "Urgent: Investment Term Sheet Follow-up & Signing Call",
    snippet: "Alex, we are ready to move forward with the Series Seed. Let's schedule a 30-min call tomorrow at 11:30 AM...",
    bodyText: `Alex,

Great news. The investment committee approved the term sheet with the revised valuation cap.

We want to get signatures locked before the weekend. Are you available tomorrow at 11:30 AM EST for a quick 30-minute confirmation call with legal?

Meeting Room: https://meet.google.com/inv-seed-call
Agenda:
1. Finalize liquidation preference clause
2. Wire instruction verification
3. Target closing date

Let me know if 11:30 AM works for you.

Best,
Marcus Vance
Partner, Acme Ventures`,
  },
  {
    sender: "security@github.com",
    senderName: "GitHub Security",
    subject: "Security Advisory: High-severity vulnerability in dependency",
    snippet: "A security vulnerability was identified in one of your repository dependencies. Action is required to patch...",
    bodyText: `GitHub Dependabot Alert

Repository: maileven-core
Severity: High (CVSS 8.1)
Package: crypto-subtle-shim (< 2.4.1)

Description:
A potential denial-of-service and memory leak has been identified in older versions of the parser library.

Recommended Action:
Update dependencies to crypto-subtle-shim@^2.4.1 and deploy to production within 48 hours.

View advisory: https://github.com/advisories/GHSA-2026-9912`,
  },
  {
    sender: "concierge@aerohotel.com",
    senderName: "Aero Hotel San Francisco",
    subject: "Reservation Confirmation: King Suite (Check-in Sept 11)",
    snippet: "Your reservation at Aero Hotel San Francisco is confirmed. Check-in time is 3:00 PM on Friday...",
    bodyText: `Aero Hotel San Francisco

Reservation ID: #AERO-88219
Guest Name: Alex Chen
Room: Deluxe King High Floor Suite
Check-in: Friday, September 11, 2026 at 3:00 PM PST
Check-out: Sunday, September 13, 2026 at 11:00 AM PST

Address: 550 Geary St, San Francisco, CA 94102
Confirmation Pin: 4910

We look forward to welcoming you to San Francisco!
The Concierge Team`,
  },
];

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

  let syncedCount = 0;

  // Case 1: Real Google Account with accessToken
  if (user.accessToken && !user.isDemo) {
    try {
      const messages = await fetchRecentGmailMessages(user.accessToken, user.refreshToken || undefined, 8);

      for (const msg of messages) {
        // Check if already stored
        const existing = await prisma.email.findFirst({
          where: {
            userId,
            googleMessageId: msg.id,
          },
        });

        if (existing) continue;

        // Run Gemini AI Analysis
        const analysis = await analyzeEmailWithGemini(
          msg.subject,
          `${msg.senderName} <${msg.sender}>`,
          msg.bodyText,
          msg.receivedAt
        );

        const newEmail = await prisma.email.create({
          data: {
            userId,
            googleMessageId: msg.id,
            threadId: msg.threadId,
            sender: msg.sender,
            senderName: msg.senderName,
            recipient: msg.recipient || user.email,
            subject: msg.subject,
            snippet: msg.snippet,
            bodyText: msg.bodyText,
            bodyHtml: msg.bodyHtml,
            receivedAt: msg.receivedAt,
            summary: analysis.summary,
            isActionable: analysis.isActionable,
            actionType: analysis.actionType,
            eventProposal: analysis.eventProposal ? JSON.stringify(analysis.eventProposal) : null,
            taskProposal: analysis.taskProposal ? JSON.stringify(analysis.taskProposal) : null,
            tags: JSON.stringify(analysis.tags),
            briefingStatus: analysis.isActionable ? "pending" : "dismissed",
            isMock: false,
          },
        });

        syncedCount++;

        // Send Push / In-App Notification for each newly synced message
        await sendNotificationToUser(userId, {
          title: `New: ${msg.subject}`,
          message: `${msg.senderName}: ${msg.snippet.slice(0, 80)}...`,
          summary: analysis.summary,
          emailId: newEmail.id,
        });
      }

      return NextResponse.json({
        success: true,
        mode: "live",
        syncedCount,
        message: syncedCount > 0 ? `Synced ${syncedCount} new email(s) from Gmail.` : "Inbox is up to date.",
      });
    } catch (err: any) {
      console.warn("Gmail API sync error, falling back to simulated sync:", err.message);
    }
  }

  // Case 2: Demo / Simulated Sync mode
  const randomTemplate =
    SIMULATED_INCOMING_TEMPLATES[
      Math.floor(Math.random() * SIMULATED_INCOMING_TEMPLATES.length)
    ];

  const now = new Date();
  const simulatedId = `sim_${Date.now()}`;

  const analysis = await analyzeEmailWithGemini(
    randomTemplate.subject,
    `${randomTemplate.senderName} <${randomTemplate.sender}>`,
    randomTemplate.bodyText,
    now
  );

  const newEmail = await prisma.email.create({
    data: {
      userId,
      googleMessageId: simulatedId,
      threadId: simulatedId,
      sender: randomTemplate.sender,
      senderName: randomTemplate.senderName,
      recipient: user.email,
      subject: randomTemplate.subject,
      snippet: randomTemplate.snippet,
      bodyText: randomTemplate.bodyText,
      receivedAt: now,
      summary: analysis.summary,
      isActionable: analysis.isActionable,
      actionType: analysis.actionType,
      eventProposal: analysis.eventProposal ? JSON.stringify(analysis.eventProposal) : null,
      taskProposal: analysis.taskProposal ? JSON.stringify(analysis.taskProposal) : null,
      tags: JSON.stringify(analysis.tags),
      briefingStatus: analysis.isActionable ? "pending" : "dismissed",
      isMock: true,
    },
  });

  syncedCount = 1;

  // Send Notification
  await sendNotificationToUser(userId, {
    title: `New Email: ${randomTemplate.subject}`,
    message: `${randomTemplate.senderName}: ${randomTemplate.snippet}`,
    summary: analysis.summary,
    emailId: newEmail.id,
  });

  return NextResponse.json({
    success: true,
    mode: "demo",
    syncedCount,
    message: `Received new email: "${randomTemplate.subject}". AI summary & notification dispatched.`,
  });
}
