"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { handleDepositConfirmed } from "@/lib/payments/handlers";

// Sandbox only: stands in for the payer completing a payment on Roqqu.
export async function simulatePayment(reference: string) {
  // Never allowed with real (live) Roqqu keys, or anyone could credit themselves.
  if (process.env.ROQQU_ENV === "live") throw new Error("Disabled");
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const deposit = await db.deposit.findUnique({ where: { reference } });
  if (!deposit || deposit.userId !== userId) throw new Error("Not found");
  await handleDepositConfirmed({ eventId: `mock_${reference}`, reference });
  redirect("/wallet?added=1");
}
