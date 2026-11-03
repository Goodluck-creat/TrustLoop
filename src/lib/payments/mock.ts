import { randomBytes } from "crypto";
import type { PaymentProvider } from "./types";

export const mockProvider: PaymentProvider = {
  async createFundingLink({ reference }) {
    return { url: `/mock-roqqu/${reference}`, reference, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  },
  async sendPayout({ reference }) {
    // Clearly fake. The real provider returns null here and confirms later via webhook.
    return { reference, txHash: "mock_" + randomBytes(16).toString("hex") };
  },
};