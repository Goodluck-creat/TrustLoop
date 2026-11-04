// One-off: turns your existing paid tasks and withdrawals into ledger rows,
// so current balances stay the same after the wallet upgrade. Safe to run twice.
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"]*)"?\s*$/);
    if (m) process.env.DATABASE_URL = m[1];
  }
}

const db = new PrismaClient();
const rows = [];

const paid = await db.task.findMany({
  where: { status: "PAID", contributorId: { not: null } },
  select: { id: true, contributorId: true, rewardNgn: true, title: true },
});
for (const t of paid) {
  rows.push({ userId: t.contributorId, type: "TASK_PAYOUT", amountNgn: t.rewardNgn, reference: `PO_${t.id}`, taskId: t.id, note: t.title });
}

const wds = await db.withdrawal.findMany({ where: { status: { not: "FAILED" } } });
for (const w of wds) {
  rows.push({ userId: w.userId, type: "WITHDRAWAL", amountNgn: -w.amountNgn, reference: w.reference, note: `${w.asset} on ${w.network}` });
}

const res = await db.ledgerEntry.createMany({ data: rows, skipDuplicates: true });
console.log(`Ledger backfill done. Added ${res.count} new row(s) (${rows.length} checked).`);
await db.$disconnect();
