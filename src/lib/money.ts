import type { Prisma } from "@prisma/client";

export async function getBalance(client: Prisma.TransactionClient, userId: string) {
  const earned = await client.task.aggregate({
    where: { contributorId: userId, status: "PAID" },
    _sum: { rewardNgn: true },
  });
  const withdrawn = await client.withdrawal.aggregate({
    where: { userId, status: { not: "FAILED" } },
    _sum: { amountNgn: true },
  });
  const e = earned._sum.rewardNgn ?? 0;
  const w = withdrawn._sum.amountNgn ?? 0;
  return { earned: e, withdrawn: w, balance: e - w };
}