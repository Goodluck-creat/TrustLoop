export type FundingLink = { url: string; reference: string; expiresAt: Date };
export type PayoutResult = { reference: string; txHash: string | null };

export interface PaymentProvider {
  createFundingLink(input: { reference: string; amountNgn: number; taskTitle: string }): Promise<FundingLink>;
  sendPayout(input: { reference: string; amountNgn: number }): Promise<PayoutResult>;
}