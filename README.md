# MailEven — AI Email Client

MailEven is an AI email client that summarizes Gmail messages, delivers notification briefings, and turns emails into Google Calendar events or Google Tasks with one tap.

Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Auth.js (NextAuth) Google Provider**, **googleapis**, **Gemini API (`@google/genai`)**, **SQLite + Prisma**, and **Web Push API / In-App Bell notifications**.

---

## Quick Start (Instant Demo Mode)

MailEven includes an instant **Demo Mode** seeded with realistic mock emails, AI executive summaries, and actionable briefing cards. You can explore and test every single feature immediately without configuring credentials.

1. **Install dependencies and push database schema**:
   ```bash
   npm install
   npx prisma db push
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. Open **[http://localhost:3000](http://localhost:3000)** in your browser and click **"Explore Live Demo"**.

---

## Connecting Your Live Google Account

To connect your real Gmail, Google Calendar, and Google Tasks, follow these steps to configure Google Cloud OAuth:

### 1. Create a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **"New Project"**.
3. Name your project (e.g. `MailEven-Assistant`) and click **Create**.

### 2. Enable Required APIs
In the Google Cloud Console, navigate to **APIs & Services > Library** and enable each of the following APIs:
- **Gmail API** (`gmail.googleapis.com`)
- **Google Calendar API** (`calendar-json.googleapis.com`)
- **Google Tasks API** (`tasks.googleapis.com`)

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required app info:
   - App name: `MailEven`
   - User support email: your email address
   - Developer contact email: your email address
4. On the **Scopes** page, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read-only access to emails)
   - `https://www.googleapis.com/auth/calendar.events` (Create and manage calendar events)
   - `https://www.googleapis.com/auth/tasks` (Create and manage tasks)
   - `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
5. On the **Test users** page, click **Add Users** and enter the Gmail address you plan to sign in with.

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application** as the Application type.
4. Set **Authorized redirect URIs** to:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Click **Create** and copy your **Client ID** and **Client Secret**.

### 5. Update `.env.local`
Edit `C:\Users\swapb\.gemini\antigravity\scratch\maileven\.env.local`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Gemini API Key (from https://aistudio.google.com)
GEMINI_API_KEY="your-gemini-api-key"
```

---

## Design System & Palette

- **Page Background**: True Black (`#000000`)
- **Panels & Surfaces**: Deep Charcoal (`#121212` – `#1A1A1A`)
- **Primary Accent**: `#FE4401`
- **Body Text**: Off-white (`#EDEDED`) and Muted (`#8A8A8E`)
- **Logo**: MailEven monogram badge in `#FE4401`

---

## Core Capabilities

1. **Inbox**:
   - Cards display sender, subject, 1–2 sentence executive AI summaries, auto-assigned tags (`Work`, `Personal`, `Finance`, `Travel`, `Newsletters`, `Promotions`, `Urgent`).
   - "View original" modal renders the full source email (headers, raw text, and rich HTML view).
   - Filter by tags or archive state.

2. **Daily Action Briefing**:
   - Deck experience presenting the day's actionable items one card at a time.
   - **Not Interested**: dismisses and archives the email from the briefing.
   - **Interested**: opens an AI pre-filled modal with proposed meeting times or task action items. On confirmation, schedules to Google Calendar or adds to Google Tasks!

3. **Ambient Notifications**:
   - Web Push notifications dispatched when new emails sync.
   - In-app notification bell fallback with unread badge counter and dropdown history.
   - "Simulate Incoming Mail" feature to test notifications live on localhost.
