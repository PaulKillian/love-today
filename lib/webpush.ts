// lib/webpush.ts
export async function ensureWebPushSubscription(remindAt: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  // iOS PWA note: users must "Add to Home Screen" for real background pushes.
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  // Register service worker
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // Get public key
  const r = await fetch("/api/push/public-key");
  const { publicKey } = await r.json();
  if (!publicKey) throw new Error("Missing VAPID public key");

  // Subscribe
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // Parse remindAt "HH:mm"
  const [h, m] = (remindAt || "08:00").split(":").map((n) => Number(n));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), tz, hour: h, minute: m }),
  });
}

// helper
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}
