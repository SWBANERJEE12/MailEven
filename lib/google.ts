import { google } from "googleapis";
import { decryptToken } from "./crypto";

export function getGoogleOAuthClient(accessToken?: string | null, refreshToken?: string | null) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Decrypt tokens if encrypted
  const plainAccess = accessToken ? decryptToken(accessToken) || accessToken : undefined;
  const plainRefresh = refreshToken ? decryptToken(refreshToken) || refreshToken : undefined;

  if (plainAccess || plainRefresh) {
    oauth2Client.setCredentials({
      access_token: plainAccess,
      refresh_token: plainRefresh,
    });
  }

  return oauth2Client;
}

export interface ParsedGmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderName: string;
  recipient: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: Date;
}

export async function fetchRecentGmailMessages(
  accessToken: string,
  refreshToken?: string,
  maxResults = 10
): Promise<ParsedGmailMessage[]> {
  const auth = getGoogleOAuthClient(accessToken, refreshToken);
  const gmail = google.gmail({ version: "v1", auth });

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox",
    maxResults,
  });

  const messages = listResponse.data.messages || [];
  const parsedMessages: ParsedGmailMessage[] = [];

  for (const msgRef of messages) {
    if (!msgRef.id) continue;
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: msgRef.id,
        format: "full",
      });

      const headers = msg.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const subject = getHeader("Subject") || "(No Subject)";
      const fromHeader = getHeader("From") || "Unknown";
      const toHeader = getHeader("To") || "";
      const dateHeader = getHeader("Date");
      const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

      const senderMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
      const senderName = senderMatch ? senderMatch[1].replace(/["']/g, "").trim() : fromHeader;
      const sender = senderMatch ? senderMatch[2].trim() : fromHeader;

      let bodyText = "";
      let bodyHtml = "";

      const extractBodyParts = (part: any) => {
        if (!part) return;
        if (part.mimeType === "text/plain" && part.body?.data) {
          bodyText += Buffer.from(part.body.data, "base64").toString("utf-8") + "\n";
        } else if (part.mimeType === "text/html" && part.body?.data) {
          bodyHtml += Buffer.from(part.body.data, "base64").toString("utf-8");
        }
        if (part.parts && Array.isArray(part.parts)) {
          part.parts.forEach(extractBodyParts);
        }
      };

      if (msg.data.payload) {
        extractBodyParts(msg.data.payload);
      }

      parsedMessages.push({
        id: msg.data.id || msgRef.id,
        threadId: msg.data.threadId || "",
        sender,
        senderName: senderName || sender,
        recipient: toHeader,
        subject,
        snippet: msg.data.snippet || "",
        bodyText: bodyText.trim() || msg.data.snippet || "",
        bodyHtml: bodyHtml || undefined,
        receivedAt,
      });
    } catch (err) {
      console.error(`Error fetching message ${msgRef.id}:`, err);
    }
  }

  return parsedMessages;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

export async function fetchGoogleCalendarLists(
  accessToken: string,
  refreshToken?: string
): Promise<GoogleCalendarItem[]> {
  try {
    const auth = getGoogleOAuthClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.calendarList.list({ minAccessRole: "writer" });

    const items = res.data.items || [];
    return items.map((item) => ({
      id: item.id || "primary",
      summary: item.summary || "Calendar",
      primary: Boolean(item.primary),
    }));
  } catch (err) {
    console.warn("fetchGoogleCalendarLists error:", err);
    return [{ id: "primary", summary: "Primary Calendar", primary: true }];
  }
}

export interface GoogleTaskListItem {
  id: string;
  title: string;
}

export async function fetchGoogleTaskLists(
  accessToken: string,
  refreshToken?: string
): Promise<GoogleTaskListItem[]> {
  try {
    const auth = getGoogleOAuthClient(accessToken, refreshToken);
    const tasksService = google.tasks({ version: "v1", auth });
    const res = await tasksService.tasklists.list();

    const items = res.data.items || [];
    return items.map((item) => ({
      id: item.id || "@default",
      title: item.title || "Default Tasks",
    }));
  } catch (err) {
    console.warn("fetchGoogleTaskLists error:", err);
    return [{ id: "@default", title: "Default Tasks" }];
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    calendarId?: string;
  }
) {
  const auth = getGoogleOAuthClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: event.calendarId || "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
      },
      end: {
        dateTime: event.endTime,
      },
    },
  });

  return {
    googleEventId: res.data.id,
    htmlLink: res.data.htmlLink,
  };
}

export async function createGoogleTaskItem(
  accessToken: string,
  refreshToken: string | undefined,
  task: {
    title: string;
    notes?: string;
    due?: string; // ISO string or YYYY-MM-DD
    taskListId?: string;
  }
) {
  const auth = getGoogleOAuthClient(accessToken, refreshToken);
  const tasksService = google.tasks({ version: "v1", auth });

  const res = await tasksService.tasks.insert({
    tasklist: task.taskListId || "@default",
    requestBody: {
      title: task.title,
      notes: task.notes,
      due: task.due ? new Date(task.due).toISOString() : undefined,
    },
  });

  return {
    googleTaskId: res.data.id,
  };
}

/**
 * Revokes an OAuth token directly with Google OAuth2 revocation endpoint.
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  const plainToken = decryptToken(token) || token;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(plainToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.ok;
  } catch (err) {
    console.warn("revokeGoogleToken network error:", err);
    return false;
  }
}
