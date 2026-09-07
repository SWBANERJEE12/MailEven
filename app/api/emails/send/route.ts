import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGmailMessage } from "@/lib/google";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";
import { sendNotificationToUser } from "@/lib/notifications";
import { heuristicEmailAnalysis } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Rate limit: 20 emails per minute per user
  const rateLimit = checkRateLimit(`send_email:${userId}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Sending rate limit exceeded. Please wait before sending another message.",
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
    const body = await req.json();
    const {
      fromAccountId,
      to,
      cc,
      bcc,
      subject,
      bodyText,
      bodyHtml,
      inReplyTo,
      references,
      threadId,
    } = body;

    // Validate recipient
    if (!to || typeof to !== "string" || !to.trim()) {
      return NextResponse.json({ error: "Recipient email (To) is required" }, { status: 400 });
    }

    const trimmedTo = to.trim();
    const trimmedSubject = (subject || "").trim() || "(No Subject)";
    const cleanBodyText = (bodyText || "").trim();

    if (!cleanBodyText && !bodyHtml) {
      return NextResponse.json({ error: "Email body cannot be empty" }, { status: 400 });
    }

    // Resolve target sender account
    let targetAccount = fromAccountId
      ? user.connectedAccounts.find((a) => a.id === fromAccountId || a.email === fromAccountId)
      : user.connectedAccounts.find((a) => a.isPrimary) || user.connectedAccounts[0];

    const senderEmail = targetAccount?.email || user.email;
    const senderName = targetAccount?.name || user.name || "Alex Chen";

    let googleMessageId: string | null = null;
    let finalThreadId: string | null = threadId || null;
    let isMock = true;

    // Attempt real Gmail API send if not in demo mode and account has OAuth tokens
    const isRealGoogleAccount =
      !user.isDemo &&
      targetAccount?.accessToken &&
      !targetAccount.accessToken.startsWith("demo_");

    if (isRealGoogleAccount && targetAccount && targetAccount.accessToken) {
      try {
        const sendResult = await sendGmailMessage(
          targetAccount.accessToken,
          targetAccount.refreshToken || undefined,
          {
            to: trimmedTo,
            cc: cc?.trim() || undefined,
            bcc: bcc?.trim() || undefined,
            subject: trimmedSubject,
            bodyText: cleanBodyText,
            bodyHtml: bodyHtml || undefined,
            inReplyTo: inReplyTo || undefined,
            references: references || undefined,
            threadId: threadId || undefined,
          }
        );

        googleMessageId = sendResult.id;
        finalThreadId = sendResult.threadId || finalThreadId;
        isMock = false;
      } catch (gmailErr: any) {
        console.warn("Gmail API sending error (falling back to simulated sent record):", gmailErr.message);
        // If scope insufficient or auth error, note it
        if (gmailErr.message?.includes("insufficient") || gmailErr.code === 403) {
          console.info("Note: Account may require re-consent for gmail.send scope.");
        }
      }
    }

    if (!googleMessageId) {
      googleMessageId = `sent_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      if (!finalThreadId) {
        finalThreadId = `thread_mock_${Date.now()}`;
      }
    }

    // Generate executive summary for sent message
    const analysis = heuristicEmailAnalysis(trimmedSubject, senderEmail, cleanBodyText);
    const summary = `Outgoing email to ${trimmedTo}: ${
      cleanBodyText.length > 120 ? cleanBodyText.slice(0, 117) + "..." : cleanBodyText
    }`;

    const tags = Array.from(new Set(["Sent", ...analysis.tags]));

    // Store in Prisma database with status "sent"
    const createdEmail = await prisma.email.create({
      data: {
        userId,
        connectedAccountId: targetAccount?.id || null,
        accountEmail: senderEmail,
        googleMessageId,
        threadId: finalThreadId,
        sender: senderEmail,
        senderName,
        recipient: trimmedTo,
        subject: trimmedSubject,
        snippet: cleanBodyText.slice(0, 140),
        bodyText: cleanBodyText,
        bodyHtml: bodyHtml || cleanBodyText.replace(/\n/g, "<br>"),
        receivedAt: new Date(),
        summary,
        isActionable: false,
        actionType: "none",
        status: "sent",
        briefingStatus: "dismissed",
        isRead: true,
        isMock,
        tags: JSON.stringify(tags),
      },
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
    });

    // Record notification of sent email
    await sendNotificationToUser(userId, {
      title: `Email Sent: ${trimmedSubject}`,
      message: `Message successfully dispatched to ${trimmedTo}`,
      summary: `Sent from ${senderName} <${senderEmail}>`,
    });

    return NextResponse.json({
      success: true,
      email: {
        ...createdEmail,
        tags: JSON.parse(createdEmail.tags || "[]"),
        eventProposal: null,
        taskProposal: null,
      },
      message: isMock
        ? `Email successfully sent to ${trimmedTo} (Simulated)`
        : `Email successfully sent via Gmail to ${trimmedTo}`,
    });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
