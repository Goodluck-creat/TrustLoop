import type { Prisma } from "@prisma/client";

// A wallet balance is the sum of its ledger rows. Credits are positive, debits negative.
export async function getBalance(client: Prisma.TransactionClient, userId: string) {
  const rows = await client.ledgerEntry.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amountNgn: true },
  });
  const sum = (t: string) => rows.find((r) => r.type === t)?._sum.amountNgn ?? 0;
  const balance = rows.reduce((a, r) => a + (r._sum.amountNgn ?? 0), 0);
  return {
    deposited: sum("DEPOSIT"),
    earned: sum("TASK_PAYOUT"),
    funded: 0 - sum("TASK_FUND"),
    withdrawn: 0 - (sum("WITHDRAWAL") + sum("REFUND")),
    balance,
  };
}
