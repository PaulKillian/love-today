// api/push/subscribe.ts
import { kv } from "@vercel/kv";

type Body = {
  subscription: any;              // PushSubscription JSON
  tz: string;                     // IANA timezone, e.g. "America/Los_Angeles"
  hour: number;                   // 0-23
  minute: number;                 // 0-59
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const b: Body = req.body || {};
  if (!b?.subscription?.endpoint || !b?.tz) {
    return res.status(400).json({ error: "subscription & tz required" });
  }
  const id = hashEndpoint(b.subscription.endpoint);
  const key = `sub:${id}`;

  await kv.hset(key, {
    id,
    endpoint: b.subscription.endpoint,
    sub: JSON.stringify(b.subscription),
    tz: b.tz,
    hour: String(b.hour ?? 8),
    minute: String(b.minute ?? 0),
    active: "1",
    createdAt: String(Date.now()),
  });
  await kv.sadd("subs:index", id);
  return res.status(200).json({ ok: true, id });
}

function hashEndpoint(s: string) {
  let h = 0, i = 0, len = s.length;
  while (i < len) { h = (h << 5) - h + s.charCodeAt(i++) | 0; }
  return String(h >>> 0);
}
