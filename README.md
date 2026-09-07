# MailEven — AI Email Client (Phase 2)

MailEven is an AI email client that summarizes messages with Gemini AI, delivers notification briefings, and turns emails into Google Calendar events or Google Tasks with one tap.

Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Auth.js (NextAuth) Google Provider**, **googleapis**, **Gemini API / Groq**, **SQLite + Prisma**, and **Web Push API / In-App Bell notifications**.

---

## Quick Start (Instant Dual-Account Demo Mode)

MailEven includes an instant **Demo Mode** seeded with realistic mock emails across two linked accounts (`alex.chen@workplace.com` and `alex.personal@gmail.com`), AI executive summaries, and actionable briefing cards. You can explore and test every single feature immediately without configuring credentials.

1. **Install dependencies and push database schema**:
   ```bash
   npm install
   npx prisma db push
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. Open **[http://localhost:3000](http://localhost:3000)** in your browser and click **"Explore Dual-Account Demo"**.

---

## Connecting Your Live Google Account(s)

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
5. On the **Test users** page, click **Add Users** and enter the Gmail address(es) you plan to connect.

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application** as the Application type.
4. Set **Authorized redirect URIs** to include both:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/api/accounts/google/callback
   ```
   *(For production/Vercel, replace `http://localhost:3000` with your custom domain or `https://your-app.vercel.app`)*
5. Click **Create** and copy your **Client ID** and **Client Secret**.

### 5. Update `.env.local`
Create or edit `.env.local` in the project root:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-nextauth-secret"

# At-Rest Token Encryption Key (32-byte / 64-hex key for AES-256-GCM)
TOKEN_ENCRYPTION_KEY="your-32-byte-hex-encryption-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Gemini / Groq API Key
GROQ_API_KEY="your-groq-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

---

## Connecting a Second Google Account

MailEven supports multiple connected accounts per user with interleaved feeds and per-account filtering:

1. In the MailEven app, locate the **Connected Account Switcher** at the top of the **Sidebar**.
2. Click on the account switcher dropdown and select **"Add Google Account"**.
3. You will be redirected to the Google OAuth consent screen (`prompt=select_account`). Log in with your second Google account and grant the requested permissions (`gmail.readonly`, `calendar.events`, `tasks`).
4. Upon approval, Google redirects back to `/api/accounts/google/callback`, encrypts tokens at rest via AES-256-GCM, and lands back in MailEven with the new account linked without touching your primary login session.
5. In your **Inbox**, **Daily Briefing**, and **AI Summary**, messages from both accounts interleave seamlessly in chronological order, with distinct colored badges and initials identifying each account.
6. Use the sidebar account switcher to filter down to a single account at any time.

---

## AI Summary of Today's & This Week's Mail

MailEven includes an executive AI summarizer accessible from the sidebar (`AI Summary`) or directly from the Daily Briefing:
- **Period Switching**: 1-click toggle between **Today's Mail** and **This Week's Mail**.
- **Executive Synthesis**: Multi-account high-level digest highlighting major themes, urgency, and decisions.
- **Action Items & Priorities**: Direct 1-tap "Schedule Event" or "Add Task" buttons pre-filled by AI.
- **Volume & Metrics**: Total email counts, actionable percentages, and category breakdown.

---

## Security & Privacy Architecture

- **Token Encryption at Rest**: All OAuth access and refresh tokens are encrypted using **AES-256-GCM** with a dedicated 32-byte key (`TOKEN_ENCRYPTION_KEY`). No plaintext tokens are stored in SQLite.
- **Session Cookie Hardening**: Cookies are configured with `httpOnly: true`, `secure: true` (in production), and `sameSite: "lax"`.
- **Rate Limiting**: Sync actions and calendar/task creation requests are rate-limited per user to protect Google API quotas and prevent abuse.
- **CSP & Origin Checks**: Content Security Policy headers and strict origin validation prevent cross-site request forgery and framing attacks.
- **Zero-Model-Training Policy**: Prominent disclosure copy confirms email content is processed strictly for summarization/classification and is never retained or used to train AI models.
- **Configurable Retention**: Auto-purge raw email bodies older than N days (default 30) while permanently keeping executive summaries and tags.
- **1-Click Account Revocation**: Revokes the OAuth token directly with Google's revocation endpoint server-side and purges all associated records from SQLite.
- **Data Portability**: Full structured JSON export of all user emails, summaries, calendar events, and tasks.

---

## Design System & Revised Palette (Light + Dark)

MailEven Phase 2 replaces high-contrast urgency with a minimal, calm aesthetic:

| Token | Name | Hex | Role |
|---|---|---|---|
| `charcoal` | Charcoal | `#2B2B2E` | Dark-mode background / light-mode primary text |
| `indigo` | Japanese Indigo | `#264348` | Primary accent — buttons, links, active states, logo |
| `stardust` | Star Dust | `#918578` | Warm neutral — secondary surfaces, subtle highlights |
| `foggy` | Foggy | `#E7E5E1` | Light-mode background / dark-mode surface tint |
| `midgrey` | Mid Grey | `#8A8A8D` | Secondary/muted text, borders |
| `steelteal` | Steel Teal | `#4F6B6E` | Secondary accent — tags, hover states |

- **Dark mode**: Background Charcoal (`#2B2B2E`), surface `#343438`, primary text Foggy (`#E7E5E1`), accent Steel Teal (`#4F6B6E`) / Japanese Indigo (`#264348`).
- **Light mode**: Background Foggy (`#E7E5E1`), surface white (`#FFFFFF`), primary text Charcoal (`#2B2B2E`), accent Japanese Indigo (`#264348`).
- **SSR Theme Painting**: Preferences persist via a typed `maileven_prefs` cookie read server-side, eliminating any flash of the wrong mode.
- **Sidebar**: Desktop navigation replacing top-bar tabs, featuring account switcher, navigation links, tag filters, and theme toggle.
- **Calendar & Task Pickers**: Action modal fetches the relevant connected account's calendar list (`calendarList.list`) and task lists, allowing you to choose the target calendar or task list.
