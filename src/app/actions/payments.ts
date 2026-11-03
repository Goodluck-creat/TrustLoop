"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { payments } from "@/lib/payments";

export async function startFunding(taskId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.orgId !== userId) throw new Error("Task not found");
  if (task.status !== "AWAITING_FUNDING") redirect("/dashboard");

  const reference = "TL" + randomBytes(7).toString("hex"); // 16 letters/digits
  await db.payment.create({
    data: { taskId: task.id, type: "FUND", reference, asset: "NGN", amount: String(task.rewardNgn) },
  });
  const link = await payments.createFundingLink({
    reference,
    amountNgn: task.rewardNgn,
    taskTitle: task.title,
  });
  redirect(link.url);
}