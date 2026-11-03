"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { payments } from "@/lib/payments";
import { handlePayoutConfirmed } from "@/lib/payments/handlers";

export async function startFunding(taskId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.orgId !== userId) throw new Error("Task not found");
  if (task.status !== "AWAITING_FUNDING") redirect("/dashboard");

  const reference = "TL" + randomBytes(7).toString("hex");
  await db.payment.create({
    data: { taskId: task.id, type: "FUND", reference, asset: "NGN", amount: String(task.rewardNgn) },
  });
  const link = await payments.createFundingLink({ reference, amountNgn: task.rewardNgn, taskTitle: task.title });
  redirect(link.url);
}

export async function startPayout(taskId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.orgId !== userId || task.status !== "APPROVED" || !task.contributorId) {
    redirect("/dashboard");
  }
  if (await db.payment.findFirst({ where: { taskId, type: "PAYOUT" } })) redirect(`/tasks/${taskId}`);

  const reference = "TL" + randomBytes(7).toString("hex");
  await db.payment.create({
    data: { taskId, type: "PAYOUT", reference, asset: "NGN", amount: String(task.rewardNgn) },
  });
  const res = await payments.sendPayout({ reference, amountNgn: task.rewardNgn });
  // Mock confirms immediately. The real provider returns no hash and the webhook confirms later.
  if (res.txHash) {
    await handlePayoutConfirmed({ eventId: `mock_payout_${reference}`, reference, txHash: res.txHash });
  }
  redirect(`/tasks/${taskId}`);
}