import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

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
  return (
    <html lang="en" className="dark bg-black">
      <body className="bg-black text-foreground antialiased min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
