import type { PaymentProvider } from "./types";

export const mockProvider: PaymentProvider = {
  async createFundingLink({ reference }) {
    return {
      url: `/mock-roqqu/${reference}`,
      reference,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  },
};