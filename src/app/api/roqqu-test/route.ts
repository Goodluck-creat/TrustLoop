import { connection } from "next/server";

export async function GET() {
  await connection();
  const key = process.env.ROQQU_SECRET_KEY;
  if (!key) return Response.json({ error: "ROQQU_SECRET_KEY is not set" }, { status: 500 });
  try {
    const res = await fetch("https://service.roqqu.com/v1/balances", {
      method: "POST",
      headers: {
        "x-staging-api-key": key.trim(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "TrustLoop/1.0 (hackathon; +https://trust-loop-theta.vercel.app)",
      },
      body: new URLSearchParams({ token: "usdt" }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return Response.json({ httpStatus: res.status, body: text.slice(0, 300) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
