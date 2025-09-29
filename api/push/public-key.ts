export default async function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}
