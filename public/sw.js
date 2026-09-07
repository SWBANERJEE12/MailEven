// MailEven Service Worker for Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'MailEven Notification',
      body: event.data.text(),
    };
  }

  const options = {
    body: payload.body || 'New email update available.',
    icon: payload.icon || '/logo.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
      emailId: payload.emailId,
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open MailEven' },
      { action: 'dismiss', title: 'Dismiss' },
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'MailEven — New Email', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
