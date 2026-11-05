import { isLiveMode, roqquRequest, asRecord } from "./client";

// The NGN price of one USDT. Live mode asks Roqqu (GET /rates, cached for 5 minutes).
// If Roqqu is unreachable, or the reply has a shape we do not recognise, we use NGN_PER_USDT.
export type Rate = { rate: number; source: "roqqu" | "fixed" };

const fixed = (): Rate => ({ rate: Number(process.env.NGN_PER_USDT ?? "1500") || 1500, source: "fixed" });
let cache: { value: Rate; at: number; ttl: number } | null = null;

const sane = (n: unknown): number | null => {
  let x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return null;
  if (x < 1) x = 1 / x; // some APIs give USD per NGN
  return x > 100 && x < 20000 ? x : null;
};

// Roqqu's docs do not show the reply shape, so accept the common ones.
export function extractNgn(data: unknown): number | null {
  const pick = (v: unknown): number | null => {
    if (typeof v === "number" || typeof v === "string") return sane(v);
    const o = asRecord(v);
    return sane(o.rate ?? o.value ?? o.price ?? o.buy ?? o.sell);
  };
  if (Array.isArray(data)) {
    for (const item of data) {
      const o = asRecord(item);
      const code = String(o.currency ?? o.code ?? o.symbol ?? o.name ?? "").toLowerCase();
      if (code === "ngn") {
        const r = pick(o);
        if (r) return r;
      }
    }
    return null;
  }
  const o = asRecord(data);
  for (const [k, v] of Object.entries(o)) {
    if (k.toLowerCase() === "ngn") {
      const r = pick(v);
      if (r) return r;
    }
  }
  for (const key of ["rates", "data", "fiat"]) {
    if (o[key] !== undefined) {
      const r = extractNgn(o[key]);
      if (r) return r;
    }
  }
  return null;
}

export async function getNgnPerUsdt(): Promise<Rate> {
  if (!isLiveMode()) return fixed();
  if (cache && Date.now() - cache.at < cache.ttl) return cache.value;
  try {
    const data = await roqquRequest("GET", "/rates", { timeoutMs: 8000 });
    const r = extractNgn(data);
    if (r) {
      cache = { value: { rate: Math.round(r * 100) / 100, source: "roqqu" }, at: Date.now(), ttl: 5 * 60_000 };
      return cache.value;
    }
    console.error("[roqqu] /rates reply had no usable NGN value");
  } catch (e) {
    console.error("[roqqu] /rates failed:", e instanceof Error ? e.message : e);
  }
  cache = { value: fixed(), at: Date.now(), ttl: 60_000 };
  return cache.value;
}
