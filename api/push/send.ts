// api/push/send.ts
import { kv } from "@vercel/kv";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export default async function handler(req, res) {
  // Optional auth for manual trigger
  if (req.method !== "GET") return res.status(405).end();

  const ids: string[] = (await kv.smembers("subs:index")) || [];
  if (!ids.length) return res.status(200).json({ ok: true, sent: 0 });

  const now = new Date();
  let sent = 0, skipped = 0, errors = 0;

  for (const id of ids) {
    const key = `sub:${id}`;
    const sub = await kv.hgetall(key) as any;
    if (!sub?.active) { skipped++; continue; }

    const { hour, minute, tz } = normalize(sub);
    const { h, m } = getLocalHM(now, tz);
    // Run every 5 minutes; send when within the same 5-min bucket to be tolerant of cron jitter
    if (bucket5(h, m) !== bucket5(hour, minute)) { skipped++; continue; }

    try {
      await webpush.sendNotification(
        JSON.parse(sub.sub),
        JSON.stringify({
          title: "Love Today",
          body: "Here’s your loving idea for the day 💛",
          clickUrl: "/", // open your app
        }),
        { TTL: 3600 }
      );
      sent++;
    } catch (e: any) {
      errors++;
      // Clean up gone subscriptions
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await kv.srem("subs:index", id);
        await kv.del(key);
      }
    }
  }

  return res.status(200).json({ ok: true, sent, skipped, errors });
}

function getLocalHM(date: Date, timeZone: string) {
  // derive local hour/min for the given IANA timezone without extra deps
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "numeric", hour12: false, timeZone
  }).formatToParts(date);
  const h = Number(parts.find(p => p.type === "hour")?.value || "0");
  const m = Number(parts.find(p => p.type === "minute")?.value || "0");
  return { h, m };
}
function bucket5(h: number, m: number) { return h * 12 + Math.floor(m / 5); }
function normalize(sub: any) {
  const hour = Number(sub?.hour ?? 8);
  const minute = Number(sub?.minute ?? 0);
  const tz = String(sub?.tz || "UTC");
  return { hour, minute, tz };
}
