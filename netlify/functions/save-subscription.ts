import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const sub = JSON.parse(event.body || "{}");
  if (!sub?.endpoint) return { statusCode: 400, body: "Bad subscription" };

  const store = getStore({ name: "push-subs", consistency: "strong" });
  // Use endpoint as key (unique per device/browser)
  await store.set(encodeURIComponent(sub.endpoint), JSON.stringify(sub));

  return { statusCode: 200, body: "ok" };
};
