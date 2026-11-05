import type { Prisma } from "@prisma/client";

// The Roqqu hash of the hirer's most recent confirmed top-up. Saved on the task's funding record
// so the payment trail can point to a real transaction.
export async function latestRoqquHash(tx: Prisma.TransactionClient, userId: string) {
  const dep = await tx.deposit.findFirst({
    where: { userId, status: "CONFIRMED", txHash: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { txHash: true, network: true },
  });
  return { txHash: dep?.txHash ?? null, network: dep?.network ?? null };
}

const HASH = /^(0x)?[0-9a-fA-F]{64}$/;
export function explorerUrl(network: string | null, hash: string | null) {
  if (!hash || !HASH.test(hash)) return null;
  switch ((network ?? "").toLowerCase()) {
    case "trc20": return `https://tronscan.org/#/transaction/${hash}`;
    case "bep20": return `https://bscscan.com/tx/${hash}`;
    case "erc20": return `https://etherscan.io/tx/${hash}`;
    case "bitcoin": return `https://mempool.space/tx/${hash}`;
    default: return null;
  }
}
