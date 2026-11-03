"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { handleFundingConfirmed } from "@/lib/payments/handlers";

export async function simulatePayment(reference: string) {
  if (process.env.PAYMENTS_MODE === "live") throw new Error("Disabled");
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const payment = await db.payment.findUnique({ where: { reference }, include: { task: true } });
  if (!payment || payment.task.orgId !== userId) throw new Error("Not found");
  await handleFundingConfirmed({ eventId: `mock_${reference}`, reference });
  redirect("/dashboard");
}