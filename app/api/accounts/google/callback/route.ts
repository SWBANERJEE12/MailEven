import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { fetchRecentGmailMessages } from "@/lib/google";
import { analyzeEmailWithGroq } from "@/lib/gemini";
import { sendNotificationToUser } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin || "http://localhost:3000";

  if (error || !code || !state) {
    console.warn("Google OAuth linking canceled or errored:", error);
    return NextResponse.redirect(`${origin}/?accountError=${encodeURIComponent(error || "missing_code")}`);
  }

  // Decrypt state to recover user session
  const decryptedState = decryptToken(state);
  if (!decryptedState) {
    return NextResponse.redirect(`${origin}/?accountError=invalid_state`);
  }

  let stateData: { userId: string; timestamp: number };
  try {
    stateData = JSON.parse(decryptedState);
  } catch {
    return NextResponse.redirect(`${origin}/?accountError=corrupted_state`);
  }

  const { userId, timestamp } = stateData;
  if (!userId || Date.now() - timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(`${origin}/?accountError=expired_state`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { connectedAccounts: true },
  });

  if (!user) {
    return NextResponse.redirect(`${origin}/?accountError=user_not_found`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/accounts/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve userinfo for the newly linked account
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfoRes = await oauth2.userinfo.get();
    const googleProfile = userInfoRes.data;

    const accountEmail = googleProfile.email;
    if (!accountEmail) {
      return NextResponse.redirect(`${origin}/?accountError=no_email_provided`);
    }

    const accountName = googleProfile.name || accountEmail.split("@")[0];
    const accountAvatar = googleProfile.picture || null;

    // Generate initials (2 letters)
    const initials = accountName
      ? accountName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : accountEmail.slice(0, 2).toUpperCase();

    // Assign account indicator color
    const existingCount = user.connectedAccounts.length;
    const PALETTE_DOTS = ["#A78D78", "#6E473B", "#4F6B6E", "#8A8A8D", "#264348"];
    const assignedColor = PALETTE_DOTS[existingCount % PALETTE_DOTS.length];

    const encryptedAccess = encryptToken(tokens.access_token);
    const encryptedRefresh = encryptToken(tokens.refresh_token);

    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        userId_email: {
          userId,
          email: accountEmail,
        },
      },
      update: {
        name: accountName,
        avatar: accountAvatar,
        accessToken: encryptedAccess,
        ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      create: {
        userId,
        email: accountEmail,
        name: accountName,
        avatar: accountAvatar,
        initials,
        color: assignedColor,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        isPrimary: existingCount === 0,
      },
    });

    // Fetch initial emails for this account asynchronously
    if (tokens.access_token) {
      try {
        const messages = await fetchRecentGmailMessages(
          tokens.access_token,
          tokens.refresh_token || undefined,
          6
        );

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

          await prisma.email.create({
            data: {
              userId,
              connectedAccountId: connectedAccount.id,
              accountEmail: accountEmail,
              googleMessageId: msg.id,
              threadId: msg.threadId,
              sender: msg.sender,
              senderName: msg.senderName,
              recipient: msg.recipient || accountEmail,
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
        }
      } catch (syncErr) {
        console.warn("Initial sync after account linking warning:", syncErr);
      }
    }

    // Record notification of successful connection
    await sendNotificationToUser(userId, {
      title: `Account Linked: ${accountEmail}`,
      message: `Successfully connected Google account (${accountName}). Emails and calendars now interleaved.`,
      summary: `Account ${accountEmail} linked with least-privilege scopes.`,
    });

    return NextResponse.redirect(
      `${origin}/?accountConnected=${encodeURIComponent(accountEmail)}`
    );
  } catch (err: any) {
    console.error("Google OAuth token exchange error:", err);
    return NextResponse.redirect(
      `${origin}/?accountError=${encodeURIComponent(err.message || "token_exchange_failed")}`
    );
  }
}
