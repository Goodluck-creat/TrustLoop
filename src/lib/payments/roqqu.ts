import type { FundingLink, PaymentProvider, PayoutResult, WalletAddress } from "./types";
import { mockProvider } from "./mock";

const BASE = process.env.ROQQU_BASE_URL ?? "https://service.roqqu.com/v1";
const APP_URL = process.env.APP_URL ?? "https://trust-loop-theta.vercel.app";

function authHeaders(): Record<string, string> {
  const key = process.env.ROQQU_SECRET_KEY?.trim();
  if (!key) throw new Error("ROQQU_SECRET_KEY is not set");
  // Test keys use x-staging-api-key. Set ROQQU_ENV=live only with a live key.
  const name = process.env.ROQQU_ENV === "live" ? "x-api-key" : "x-staging-api-key";
  return {
    [name]: key,
    Accept: "application/json",
    "User-Agent": "TrustLoop/1.0",
  };
}

async function call(path: string, body: Record<string, string>, format: "form" | "json" = "form") {
  const headers = authHeaders();
  headers["Content-Type"] = format === "json" ? "application/json" : "application/x-www-form-urlencoded";
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: format === "json" ? JSON.stringify(body) : new URLSearchParams(body),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const text = await res.text();
  let json: { status?: string; message?: string; data?: Record<string, unknown> };
  try {
    json = JSON.parse(text);
  } catch {
    // For example the Cloudflare "Just a moment" page.
    throw new Error(`Roqqu returned a non-JSON reply (HTTP ${res.status})`);
  }
  if (!res.ok || json.status !== "success") {
    throw new Error(`Roqqu error (HTTP ${res.status}): ${json.message ?? "unknown"}`);
  }
  return json.data ?? {};
}

// Roqqu wants 1 to 20 letters and numbers. Our full reference travels in metadata.
function shortRef(reference: string) {
  const clean = reference.replace(/[^a-zA-Z0-9]/g, "");
  return clean.slice(-20) || "TL" + Date.now().toString(36);
}

// If Roqqu cannot be reached, fall back to the simulator so the app never breaks.
// Set PAYMENTS_FALLBACK=off to see the real error instead.
async function withFallback<T>(live: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await live();
  } catch (e) {
    console.error("[roqqu] falling back to the simulator:", e);
    if (process.env.PAYMENTS_FALLBACK === "off") throw e;
    return fallback();
  }
}

export const roqquProvider: PaymentProvider = {
  createFundingLink(input) {
    const { reference, amountNgn, taskTitle } = input;
    return withFallback<FundingLink>(
      async () => {
        const [first, ...rest] = (input.customerName ?? "TrustLoop Hirer").split(" ");
        const data = await call("/payment-links", {
          amount: String(amountNgn),
          amount_currency: "ngn",
          customer_details: JSON.stringify({
            email: input.customerEmail ?? "hirer@trustloop.app",
            first_name: first || "TrustLoop",
            last_name: rest.join(" ") || "Hirer",
          }),
          payment_reference: shortRef(reference),
          success_url: `${APP_URL}/wallet?added=1`,
          cancel_url: `${APP_URL}/wallet`,
          metadata: JSON.stringify({ reference, task: taskTitle.slice(0, 60) }),
        });
        const url = String(data.payment_link ?? "");
        if (!url) throw new Error("Roqqu did not return a payment link");
        const exp = data.expires_at ? new Date(String(data.expires_at)) : null;
        return { url, reference, expiresAt: exp ?? new Date(Date.now() + 2 * 60 * 60 * 1000) };
      },
      () => mockProvider.createFundingLink(input),
    );
  },

  sendPayout(input) {
    const { reference, amountNgn, toAddress } = input;
    return withFallback<PayoutResult>(
      async () => {
        if (!toAddress) throw new Error("No destination address for a USDT payout");
        const rate = Number(process.env.NGN_PER_USDT ?? "1500"); // set a real rate before going live
        const usdt = (amountNgn / rate).toFixed(2);
        await call("/wallets/send", {
          amount: usdt,
          network: input.network ?? "trc20",
          to: toAddress,
          token: "usdt",
        });
        // Roqqu confirms on-chain later through a webhook, so no hash yet.
        return { reference, txHash: null };
      },
      () => mockProvider.sendPayout(input),
    );
  },

  createWallet(input) {
    return withFallback<WalletAddress>(
      async () => {
        const network = input.network ?? "trc20";
        const data = await call(
          "/wallets/generate-wallet",
          {
            network,
            customer: JSON.stringify({
              email: input.email,
              first_name: input.firstName,
              last_name: input.lastName,
            }),
          },
          "json",
        );
        const address = String(data.address ?? "");
        if (!address) throw new Error("Roqqu did not return an address");
        return { address, network, sandbox: false };
      },
      () => mockProvider.createWallet(input),
    );
  },
};
