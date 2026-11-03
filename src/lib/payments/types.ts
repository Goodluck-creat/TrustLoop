export type FundingLink = { url: string; reference: string; expiresAt: Date };

export interface PaymentProvider {
  createFundingLink(input: {
    reference: string;
    amountNgn: number;
    taskTitle: string;
  }): Promise<FundingLink>;
  // sendPayout() is added in the next step
}