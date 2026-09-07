import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { DEMO_ACCOUNTS, INITIAL_MOCK_EMAILS } from "./mock-data";
import { encryptToken } from "./crypto";

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
              name: "Alex Chen",
              image: "https://lh3.googleusercontent.com/a/default-user=s96-c",
              isDemo: true,
            },
          });
        }

        // Ensure both demo connected accounts exist
        const accountMap = new Map<string, string>(); // demoId -> dbId

        for (const demoAcc of DEMO_ACCOUNTS) {
          const dbAcc = await prisma.connectedAccount.upsert({
            where: {
              userId_email: {
                userId: user.id,
                email: demoAcc.email,
              },
            },
            update: {
              name: demoAcc.name,
              color: demoAcc.color,
              initials: demoAcc.initials,
              isPrimary: demoAcc.isPrimary,
            },
            create: {
              userId: user.id,
              email: demoAcc.email,
              name: demoAcc.name,
              color: demoAcc.color,
              initials: demoAcc.initials,
              isPrimary: demoAcc.isPrimary,
              accessToken: encryptToken("demo_access_token"),
              refreshToken: encryptToken("demo_refresh_token"),
            },
          });
          accountMap.set(demoAcc.id, dbAcc.id);
        }

        // Seed or update dual-account mock emails
        const unlinkedEmail = await prisma.email.findFirst({
          where: { userId: user.id, connectedAccountId: null },
        });
        const existingCount = await prisma.email.count({ where: { userId: user.id } });

        if (existingCount === 0 || unlinkedEmail) {
          if (unlinkedEmail) {
            await prisma.email.deleteMany({ where: { userId: user.id } });
          }

          for (const mock of INITIAL_MOCK_EMAILS) {
            const connectedAccId = accountMap.get(mock.accountId);
            await prisma.email.create({
              data: {
                userId: user.id,
                connectedAccountId: connectedAccId || null,
                accountEmail: mock.accountEmail,
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

          // Initial welcome notification
          await prisma.notificationLog.create({
            data: {
              userId: user.id,
              title: "Welcome to MailEven",
              message: "Dual demo accounts connected: Alex Chen (Work) and Alex Chen (Personal). Interleaved feed active.",
              summary: "Inbox and briefing are populated with interleaved messages from both accounts.",
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
    async jwt({ token, account, user, profile }) {
      if (user) {
        token.userId = user.id;
        token.isDemo = (user as any).isDemo ?? false;
      }

      // When signing in or linking an account with Google OAuth
      if (account && account.provider === "google") {
        const accountEmail = (profile as any)?.email || token.email;
        const accountName = (profile as any)?.name || token.name || "Google Account";
        const accountAvatar = (profile as any)?.picture || token.picture;

        // Compute initials from account name or email
        const initials = accountName
          ? accountName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : (accountEmail?.[0] || "G").toUpperCase();

        const encryptedAccess = encryptToken(account.access_token);
        const encryptedRefresh = encryptToken(account.refresh_token);

        try {
          // If the user was not already logged in, find or create the primary User
          let userId = token.userId as string | undefined;
          if (!userId) {
            const dbUser = await prisma.user.upsert({
              where: { email: accountEmail! },
              update: {
                name: accountName,
                image: accountAvatar,
                accessToken: encryptedAccess,
                refreshToken: encryptedRefresh ?? undefined,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                isDemo: false,
              },
              create: {
                email: accountEmail!,
                name: accountName,
                image: accountAvatar,
                googleId: account.providerAccountId,
                accessToken: encryptedAccess,
                refreshToken: encryptedRefresh,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                isDemo: false,
              },
            });
            userId = dbUser.id;
            token.userId = userId;
          }

          // Check existing connected accounts count for this user
          const existingCount = await prisma.connectedAccount.count({
            where: { userId },
          });

          // Upsert the ConnectedAccount record with encrypted tokens
          await prisma.connectedAccount.upsert({
            where: {
              userId_email: {
                userId,
                email: accountEmail!,
              },
            },
            update: {
              name: accountName,
              avatar: accountAvatar,
              accessToken: encryptedAccess,
              ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              isPrimary: existingCount === 0,
            },
            create: {
              userId,
              email: accountEmail!,
              name: accountName,
              avatar: accountAvatar,
              initials,
              color: "#264348",
              accessToken: encryptedAccess,
              refreshToken: encryptedRefresh,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              isPrimary: existingCount === 0,
            },
          });
        } catch (e) {
          console.error("Error upserting Google ConnectedAccount in DB:", e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId || token.sub;
        (session.user as any).isDemo = token.isDemo || false;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
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
