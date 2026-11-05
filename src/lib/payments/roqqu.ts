import type { FundingLink, PaymentProvider, PayoutResult, WalletAddress } from "./types";
import { mockProvider } from "./mock";
import { roqquRequest, asRecord } from "./client";
import { getNgnPerUsdt } from "./rates";

const APP_URL = process.env.APP_URL ?? "https://trust-loop-theta.vercel.app";

// Roqqu wants 1 to 20 letters and numbers. Our full reference travels in metadata.
export function shortRef(reference: string) {
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
        const data = asRecord(
          await roqquRequest("POST", "/payment-links", {
            form: {
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
            },
          }),
        );
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
        if (!toAddress) throw new Error("No destination address for a payout");
        const { rate } = await getNgnPerUsdt();
        const amount = (amountNgn / rate).toFixed(2);
        const data = asRecord(
          await roqquRequest("POST", "/wallets/send", {
            form: {
              amount,
              network: input.network ?? "trc20",
              to: toAddress,
              token: (input.token ?? "usdt").toLowerCase(),
            },
          }),
        );
        // Roqqu queues the send and returns its own id. The on-chain hash comes later by webhook.
        const refid = data.refid ? String(data.refid) : null;
        return { reference, txHash: null, refid };
      },
      () => mockProvider.sendPayout(input),
    );
  },

  createWallet(input) {
    return withFallback<WalletAddress>(
      async () => {
        const network = input.network ?? "trc20";
        const data = asRecord(
          await roqquRequest("POST", "/wallets/generate-wallet", {
            json: {
              network,
              customer: JSON.stringify({ email: input.email, first_name: input.firstName, last_name: input.lastName }),
            },
          }),
        );
        const address = String(data.address ?? "");
        if (!address) throw new Error("Roqqu did not return an address");
        return { address, network, sandbox: false };
      },
      () => mockProvider.createWallet(input),
    );
  },
};
