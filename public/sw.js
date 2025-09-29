/* public/sw.js */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || "Love Today";
  const body  = data.body  || "Here's your loving idea for the day 💛";
  const icon  = data.icon  || "/assets/icon.png";     // optional
  const badge = data.badge || "/assets/icon.png";     // optional
  const tag   = data.tag   || "love-today";

  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge, tag,
      data: data.clickUrl ? { clickUrl: data.clickUrl } : undefined
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.clickUrl) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.registration.scope));
      if (existing) { existing.focus(); existing.navigate(url); return; }
      return self.clients.openWindow(url);
    })
  );
});
