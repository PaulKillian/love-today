self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    data: data.data || {},
    badge: "/icons/badge.png"
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
