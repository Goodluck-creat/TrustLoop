// One place that talks to Roqqu. Everything else goes through here.
// Live vs sandbox is decided by environment variables only, so switching is a settings change.
//   PAYMENTS_MODE=live  -> use Roqqu (otherwise the built-in simulator is used)
//   ROQQU_ENV=live      -> use the live key header (x-api-key) instead of the test one
const BASE = process.env.ROQQU_BASE_URL ?? "https://service.roqqu.com/v1";

export const isLiveMode = () => process.env.PAYMENTS_MODE === "live" && Boolean(process.env.ROQQU_SECRET_KEY?.trim());
export const isProdKey = () => process.env.ROQQU_ENV === "live";

export class RoqquError extends Error {
  constructor(message: string, public httpStatus: number | null = null) {
    super(message);
  }
}

function authHeaders(): Record<string, string> {
  const key = process.env.ROQQU_SECRET_KEY?.trim();
  if (!key) throw new RoqquError("ROQQU_SECRET_KEY is not set");
  const name = isProdKey() ? "x-api-key" : "x-staging-api-key";
  return { [name]: key, Accept: "application/json", "User-Agent": "TrustLoop/1.0" };
}

type Opts = { form?: Record<string, string>; json?: unknown; query?: Record<string, string>; timeoutMs?: number };

// Returns the "data" part of a successful reply. Throws RoqquError otherwise.
export async function roqquRequest(method: "GET" | "POST", path: string, opts: Opts = {}): Promise<unknown> {
  const headers = authHeaders();
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(opts.form);
  }
  const qs = opts.query ? "?" + new URLSearchParams(opts.query).toString() : "";
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs}`, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
      cache: "no-store",
    });
  } catch (e) {
    throw new RoqquError(`Could not reach Roqqu: ${e instanceof Error ? e.message : "network error"}`);
  }
  const text = await res.text();
  let parsed: { status?: string; message?: string; data?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    // For example the Cloudflare "Just a moment" page.
    throw new RoqquError(`Roqqu returned a non-JSON reply (HTTP ${res.status})`, res.status);
  }
  if (!res.ok || parsed.status !== "success") {
    throw new RoqquError(`Roqqu error (HTTP ${res.status}): ${parsed.message ?? "unknown"}`, res.status);
  }
  return parsed.data ?? {};
}

export const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
