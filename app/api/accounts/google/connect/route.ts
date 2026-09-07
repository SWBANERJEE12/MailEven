import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { encryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/?authError=unauthorized", req.url));
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return NextResponse.redirect(new URL("/?authError=no_user_id", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?authError=missing_google_credentials", req.url));
  }

  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin || "http://localhost:3000";
  const redirectUri = `${origin}/api/accounts/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const statePayload = JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7),
  });

  const encryptedState = encryptToken(statePayload);

  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/tasks",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    scope: scopes,
    state: encryptedState || undefined,
  });

  return NextResponse.redirect(authUrl);
}
