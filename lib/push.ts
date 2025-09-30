// /src/push.ts
export async function enablePush() {
  if (!("serviceWorker" in navigator)) throw new Error("No service worker");
  if (!("PushManager" in window)) throw new Error("No Push API");

  // Must be triggered from a user gesture (e.g., button click)
  const reg = await navigator.serviceWorker.register("/sw.js");

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permission denied");

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; // expose via Vite/Next public env
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await fetch("/.netlify/functions/save-subscription", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sub),
  });
}

// helper
function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}
