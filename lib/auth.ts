import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { INITIAL_MOCK_EMAILS } from "./mock-data";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/tasks",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "demo-login",
      name: "Demo Mode",
      credentials: {},
      async authorize() {
        const demoEmail = process.env.DEMO_USER_EMAIL || "demo@maileven.ai";

        // Find or create demo user
        let user = await prisma.user.findUnique({
          where: { email: demoEmail },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: demoEmail,
              name: "Alex Chen (Demo)",
              image: "https://lh3.googleusercontent.com/a/default-user=s96-c",
              isDemo: true,
            },
          });

          // Seed demo emails for this new demo user
          for (const mock of INITIAL_MOCK_EMAILS) {
            await prisma.email.create({
              data: {
                userId: user.id,
                googleMessageId: mock.id,
                threadId: mock.id,
                sender: mock.sender,
                senderName: mock.senderName,
                recipient: mock.recipient,
                subject: mock.subject,
                snippet: mock.snippet,
                bodyText: mock.bodyText,
                receivedAt: new Date(mock.receivedAt),
                summary: mock.summary,
                isActionable: mock.isActionable,
                actionType: mock.actionType,
                eventProposal: mock.eventProposal ? JSON.stringify(mock.eventProposal) : null,
                taskProposal: mock.taskProposal ? JSON.stringify(mock.taskProposal) : null,
                tags: JSON.stringify(mock.tags),
                briefingStatus: mock.briefingStatus,
                isMock: true,
              },
            });
          }

          // Also create an initial notification
          await prisma.notificationLog.create({
            data: {
              userId: user.id,
              title: "Welcome to MailEven",
              message: "Your inbox is ready. 7 sample messages have been analyzed with executive summaries and action classifications.",
              summary: "Daily briefing has 4 actionable items awaiting your review.",
              isRead: false,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isDemo: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.userId = user.id;
        token.isDemo = (user as any).isDemo ?? false;
      }

      // When signing in with Google OAuth
      if (account && account.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Sync or create user in SQLite database
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: token.email! },
            update: {
              name: token.name,
              image: token.picture,
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? undefined,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              isDemo: false,
            },
            create: {
              email: token.email!,
              name: token.name,
              image: token.picture,
              googleId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              isDemo: false,
            },
          });
          token.userId = dbUser.id;
        } catch (e) {
          console.error("Error upserting Google user in DB:", e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId || token.sub;
        (session.user as any).isDemo = token.isDemo || false;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
