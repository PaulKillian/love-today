import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT as string,
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export const handler: Handler = async () => {
  const store = getStore({ name: "push-subs", consistency: "strong" });
  const list = await store.list(); // iterate keys
  const payload = JSON.stringify({
    title: "Love Today",
    body: "Here’s your daily nudge ❤️",
    icon: "/icons/icon-192.png", // optional
    data: { url: "/" }           // where to open on click
  });

  // Fire and forget to all subscribers
  await Promise.all(
    (list.objects || []).map(async (obj) => {
      const subRaw = await store.get(obj.key);
      if (!subRaw) return;
      const subscription = JSON.parse(subRaw);
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err: any) {
        // Clean up gone subscriptions
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await store.delete(obj.key);
        }
      }
    })
  );

  return { statusCode: 200, body: "sent" };
};
