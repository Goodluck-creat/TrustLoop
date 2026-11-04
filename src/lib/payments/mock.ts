import { randomBytes } from "crypto";
import type { PaymentProvider } from "./types";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const mockProvider: PaymentProvider = {
  async createFundingLink({ reference }) {
    return { url: `/mock-roqqu/${reference}`, reference, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  },
  async sendPayout({ reference }) {
    // Clearly fake. The real provider returns null here and confirms later via webhook.
    return { reference, txHash: "mock_" + randomBytes(16).toString("hex") };
  },
  async createWallet({ network }) {
    // A simulated address. It exists on no network and the app labels it as such.
    const address = "T" + Array.from(randomBytes(33), (b) => B58[b % 58]).join("");
    return { address, network: network ?? "trc20", sandbox: true };
  },
};
