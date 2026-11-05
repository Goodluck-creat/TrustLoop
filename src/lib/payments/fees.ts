import { isLiveMode, roqquRequest, asRecord } from "./client";

// Roqqu's fee for sending USDT (GET /transaction/fee). Shown to the user before a withdrawal.
export type Fee = { percentage: number | null; fee: number | null };
let cache: { value: Fee | null; at: number } | null = null;

export async function getSendFee(): Promise<Fee | null> {
  if (!isLiveMode()) return null;
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.value;
  let value: Fee | null = null;
  try {
    const d = asRecord(await roqquRequest("GET", "/transaction/fee", { query: { token: "usdt" }, timeoutMs: 8000 }));
    const pct = Number(d.percentage);
    const fee = Number(d.fee);
    value = { percentage: Number.isFinite(pct) ? pct : null, fee: Number.isFinite(fee) ? fee : null };
  } catch (e) {
    console.error("[roqqu] fee lookup failed:", e instanceof Error ? e.message : e);
  }
  cache = { value, at: Date.now() };
  return value;
}
