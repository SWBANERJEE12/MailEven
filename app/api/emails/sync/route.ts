import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentGmailMessages } from "@/lib/google";
import { analyzeEmailWithGroq } from "@/lib/gemini";
import { applyPersonalization } from "@/lib/personalization";
import { sendNotificationToUser } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

const SIMULATED_INCOMING_TEMPLATES = [
  {
    sender: "marcus.vance@acme-ventures.com",
    senderName: "Marcus Vance",
    subject: "Urgent: Investment Term Sheet Follow-up & Signing Call",
    accountEmail: "alex.chen@workplace.com",
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
    sender: "concierge@aerohotel.com",
    senderName: "Aero Hotel San Francisco",
    subject: "Reservation Confirmation: King Suite (Check-in Sept 11)",
    accountEmail: "alex.personal@gmail.com",
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
  {
    sender: "security@github.com",
    senderName: "GitHub Security",
    subject: "Security Advisory: High-severity vulnerability in dependency",
    accountEmail: "alex.chen@workplace.com",
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
];

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Rate limit: 10 syncs per 60s per user
  const rateLimit = checkRateLimit(`sync:${userId}`, 10, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Sync rate limit reached to protect API quotas. Please wait a moment.",
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

  // Auto-retention purge: Automatically purge bodies older than configured retentionDays
  try {
    const retentionDays = user.retentionDays || 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await prisma.email.updateMany({
      where: {
        userId,
        receivedAt: { lt: cutoffDate },
        bodyText: { not: null },
      },
      data: {
        bodyText: null,
        bodyHtml: null,
        bodyPurgedAt: new Date(),
      },
    });
  } catch (purgeErr) {
    console.warn("Background auto-retention purge error:", purgeErr);
  }

  let syncedCount = 0;

  // Check if user has live Google connected accounts
  const liveAccounts = user.connectedAccounts.filter(
    (acc) => !user.isDemo && acc.accessToken && !acc.accessToken.startsWith("demo_")
  );

  if (liveAccounts.length > 0) {
    for (const acc of liveAccounts) {
      try {
        // A regular sync brings in a substantial working set without attempting an
        // unbounded historical import in a single serverless request.
        const messages = await fetchRecentGmailMessages(acc.accessToken!, acc.refreshToken || undefined, 50);

        for (const msg of messages) {
          const existing = await prisma.email.findFirst({
            where: {
              userId,
              googleMessageId: msg.id,
            },
          });

          if (existing) continue;

          const analysis = await analyzeEmailWithGroq(
            msg.subject,
            `${msg.senderName} <${msg.sender}>`,
            msg.bodyText,
            msg.receivedAt
          );

          // Apply user-specific learned personalization
          const decision = await applyPersonalization(
            userId,
            analysis,
            msg.sender
          );

          const newEmail = await prisma.email.create({
            data: {
              userId,
              connectedAccountId: acc.id,
              accountEmail: acc.email,
              googleMessageId: msg.id,
              threadId: msg.threadId,
              sender: msg.sender,
              senderName: msg.senderName,
              recipient: msg.recipient || acc.email,
              subject: msg.subject,
              snippet: msg.snippet,
              bodyText: msg.bodyText,
              bodyHtml: msg.bodyHtml,
              receivedAt: msg.receivedAt,
              summary: analysis.summary,
              isActionable: decision.requiresAction,
              actionType: decision.actionType,
              category: decision.category,
              priority: decision.priority,
              personalizationReason: decision.reason,
              personalizationConfidence: decision.confidence,
              eventProposal: decision.eventProposal ? JSON.stringify(decision.eventProposal) : null,
              taskProposal: decision.taskProposal ? JSON.stringify(decision.taskProposal) : null,
              tags: JSON.stringify(decision.tags),
              briefingStatus: decision.requiresAction ? "pending" : "dismissed",
              isMock: false,
            },
          });

          syncedCount++;

          await sendNotificationToUser(userId, {
            title: `[${decision.priority.toUpperCase()}] ${acc.name || acc.email}: ${msg.subject}`,
            message: `${msg.senderName}: ${msg.snippet.slice(0, 75)}...`,
            summary: analysis.summary,
            emailId: newEmail.id,
          });
        }
      } catch (err: any) {
        console.warn(`Sync error for account ${acc.email}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      mode: "live",
      syncedCount,
      message: syncedCount > 0 ? `Synced ${syncedCount} new email(s) across linked Google accounts.` : "All accounts are up to date.",
    });
  }

  // Simulated Demo Sync Mode
  const randomTemplate =
    SIMULATED_INCOMING_TEMPLATES[
      Math.floor(Math.random() * SIMULATED_INCOMING_TEMPLATES.length)
    ];

  const now = new Date();
  const simulatedId = `sim_${Date.now()}`;

  // Match connected account for template or pick first connected account
  const matchingAcc =
    user.connectedAccounts.find((a) => a.email === randomTemplate.accountEmail) ||
    user.connectedAccounts[0];

  const analysis = await analyzeEmailWithGroq(
    randomTemplate.subject,
    `${randomTemplate.senderName} <${randomTemplate.sender}>`,
    randomTemplate.bodyText,
    now
  );

  // Apply Personalized Learning Engine to simulated email
  const decision = await applyPersonalization(
    userId,
    analysis,
    `${randomTemplate.senderName} <${randomTemplate.sender}>`
  );

  const newEmail = await prisma.email.create({
    data: {
      userId,
      connectedAccountId: matchingAcc?.id || null,
      accountEmail: matchingAcc?.email || user.email,
      googleMessageId: simulatedId,
      threadId: simulatedId,
      sender: randomTemplate.sender,
      senderName: randomTemplate.senderName,
      recipient: matchingAcc?.email || user.email,
      subject: randomTemplate.subject,
      snippet: randomTemplate.snippet,
      bodyText: randomTemplate.bodyText,
      receivedAt: now,
      summary: decision.summary,
      isActionable: decision.requiresAction,
      actionType: decision.actionType,
      category: decision.category,
      priority: decision.priority,
      personalizationReason: decision.reason,
      personalizationConfidence: decision.confidence,
      eventProposal: decision.eventProposal ? JSON.stringify(decision.eventProposal) : null,
      taskProposal: decision.taskProposal ? JSON.stringify(decision.taskProposal) : null,
      tags: JSON.stringify(decision.tags),
      briefingStatus: decision.requiresAction ? "pending" : "dismissed",
      isMock: true,
    },
  });

  syncedCount = 1;

  await sendNotificationToUser(userId, {
    title: `[${matchingAcc?.initials || "AC"}] ${randomTemplate.subject}`,
    message: `${randomTemplate.senderName}: ${randomTemplate.snippet}`,
    summary: analysis.summary,
    emailId: newEmail.id,
  });

  return NextResponse.json({
    success: true,
    mode: "demo",
    syncedCount,
    message: `Received new email for ${matchingAcc?.email || user.email}: "${randomTemplate.subject}". Dispatched to briefing.`,
  });
}
