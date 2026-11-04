"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import { notify } from "@/lib/notify";
import { payments } from "@/lib/payments";
import { handlePayoutConfirmed } from "@/lib/payments/handlers";

// Funds a task from the hirer's wallet. The reward is locked for the task at once.
// If the wallet is short, the hirer is sent to add money first.
export async function startFunding(taskId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.orgId !== userId) throw new Error("Task not found");
  if (task.status !== "AWAITING_FUNDING") redirect("/dashboard");

  const reference = "TL" + randomBytes(7).toString("hex");
  let shortfall = 0;
  try {
    await db.$transaction(
      async (tx) => {
        const claimed = await tx.task.updateMany({
          where: { id: task.id, orgId: userId, status: "AWAITING_FUNDING" },
          data: { status: "FUNDED" },
        });
        if (claimed.count !== 1) throw new Error("ALREADY");
        const { balance } = await getBalance(tx, userId);
        if (balance < task.rewardNgn) {
          shortfall = task.rewardNgn - balance;
          throw new Error("INSUFFICIENT");
        }
        await tx.ledgerEntry.create({
          data: {
            userId,
            type: "TASK_FUND",
            amountNgn: -task.rewardNgn,
            reference: `TF_${task.id}`,
            taskId: task.id,
            note: task.title,
          },
        });
        await tx.payment.create({
          data: { taskId: task.id, type: "FUND", status: "CONFIRMED", reference, asset: "NGN", amount: String(task.rewardNgn) },
        });
        await notify(tx, userId, "Task funded", `₦${task.rewardNgn.toLocaleString("en-NG")} was locked for "${task.title}".`, `/tasks/${task.id}`);
      },
      { isolationLevel: "Serializable" },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") redirect(`/wallet?need=${shortfall}&task=${task.id}`);
    if (e instanceof Error && e.message === "ALREADY") redirect("/dashboard");
    throw e;
  }
  redirect("/dashboard");
}

// Older flow, kept so existing imports still compile. Approval now pays instantly.
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
  if (res.txHash) {
    await handlePayoutConfirmed({ eventId: `mock_payout_${reference}`, reference, txHash: res.txHash });
  }
  redirect(`/tasks/${taskId}`);
}
