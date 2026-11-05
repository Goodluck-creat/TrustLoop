export type FundingLink = { url: string; reference: string; expiresAt: Date };
// refid is Roqqu's id for a queued send. The on-chain hash arrives later by webhook.
export type PayoutResult = { reference: string; txHash: string | null; refid?: string | null };
export type WalletAddress = { address: string; network: string; sandbox: boolean };

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
    token?: string; // usdt (default)
  }): Promise<PayoutResult>;
  createWallet(input: {
    email: string;
    firstName: string;
    lastName: string;
    network?: string;
  }): Promise<WalletAddress>;
}
