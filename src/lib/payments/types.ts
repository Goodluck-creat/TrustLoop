export type FundingLink = { url: string; reference: string; expiresAt: Date };
export type PayoutResult = { reference: string; txHash: string | null };

export interface PaymentProvider {
  createFundingLink(input: {
    reference: string;
    amountNgn: number;
    taskTitle: string;
    // Optional. The Roqqu provider needs a customer; defaults are used when missing.
    customerEmail?: string;
    customerName?: string;
  }): Promise<FundingLink>;
  sendPayout(input: {
    reference: string;
    amountNgn: number;
    // Optional. Needed for a real USDT payout; without it the simulator is used.
    toAddress?: string;
    network?: string; // trc20 (default), bep20, ...
  }): Promise<PayoutResult>;
}