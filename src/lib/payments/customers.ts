import { db } from "@/lib/db";
import { isLiveMode, roqquRequest, asRecord } from "./client";

// Roqqu keeps a record of each customer (the people we generate wallets for).
// "verified" and "blacklisted" are flags on that record (GET /customers).
// Returns null when Roqqu has no such customer, undefined when Roqqu could not be asked.
export type CustomerState = { verified: boolean; blacklisted: boolean };
const cache = new Map<string, { value: CustomerState | null; at: number }>();

export async function lookupCustomer(email: string): Promise<CustomerState | null | undefined> {
  if (!isLiveMode()) return undefined;
  const key = email.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.value;
  let value: CustomerState | null = null;
  try {
    const data = await roqquRequest("GET", "/customers", { timeoutMs: 10000 });
    const list = Array.isArray(data) ? data : Array.isArray(asRecord(data).customers) ? (asRecord(data).customers as unknown[]) : [];
    const row = list.map(asRecord).find((c) => String(c.email ?? "").toLowerCase() === key);
    if (row) value = { verified: Number(row.verified) === 1 || row.verified === true, blacklisted: Number(row.blacklisted) === 1 || row.blacklisted === true };
  } catch (e) {
    console.error("[roqqu] customer lookup failed:", e instanceof Error ? e.message : e);
    return undefined; // could not ask Roqqu; do not cache
  }
  cache.set(key, { value, at: Date.now() });
  return value;
}

// Saves the Roqqu state on the user so the Trust Passport can show a badge without a live call.
export async function refreshRoqquStatus(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return "unknown";
  if (!isLiveMode()) return "sandbox";
  const c = await lookupCustomer(user.email);
  if (c === undefined) return "unknown";
  const status = c === null ? "not_found" : c.blacklisted ? "blacklisted" : c.verified ? "verified" : "unverified";
  await db.user.update({ where: { id: userId }, data: { roqquStatus: status, roqquCheckedAt: new Date() } });
  return status;
}
