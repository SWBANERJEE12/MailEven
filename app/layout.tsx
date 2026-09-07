import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { parsePreferences, PREFERENCES_COOKIE_NAME } from "@/lib/cookies";

export const metadata: Metadata = {
  title: "MailEven — AI Email Client",
  description:
    "AI email client that summarizes Gmail, sends notification briefings, and turns emails into calendar events or tasks with one tap.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const rawPrefs = cookieStore.get(PREFERENCES_COOKIE_NAME)?.value;
  const prefs = parsePreferences(rawPrefs);

  // Server-rendered initial html class
  const initialClass = prefs.theme === "light" ? "light" : "dark";

  return (
    <html lang="en" className={initialClass} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var match = document.cookie.split('; ').find(function(row) { return row.startsWith('${PREFERENCES_COOKIE_NAME}='); });
                if (match) {
                  var prefs = JSON.parse(decodeURIComponent(match.split('=')[1]));
                  var isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } else {
                  var isSysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isSysDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen transition-colors duration-150">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
