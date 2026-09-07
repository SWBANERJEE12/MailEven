import { prisma } from "./prisma";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      "mailto:admin@maileven.ai",
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err) {
    console.warn("Failed to configure web-push VAPID details:", err);
  }
}

export interface NotificationPayload {
  title: string;
  message: string;
  summary?: string;
  emailId?: string;
}

export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
) {
  // 1. Save in-app notification record in database
  const notification = await prisma.notificationLog.create({
    data: {
      userId,
      title: payload.title,
      message: payload.message,
      summary: payload.summary,
      emailId: payload.emailId,
      isRead: false,
    },
  });

  // 2. Dispatch to Web Push subscriptions (if registered)
  if (vapidPublicKey && vapidPrivateKey) {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subs) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const pushData = JSON.stringify({
        title: payload.title,
        body: payload.summary || payload.message,
        emailId: payload.emailId,
        url: payload.emailId ? `/?emailId=${payload.emailId}` : "/",
      });

      try {
        await webpush.sendNotification(pushConfig, pushData);
      } catch (err: any) {
        console.warn(`Web push send error for sub ${sub.id}:`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or unregistered
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }

  return notification;
}
