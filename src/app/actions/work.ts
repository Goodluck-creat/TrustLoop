"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { issueCredential } from "@/lib/credentials";
import { notify } from "@/lib/notify";

async function me() {
  const id = await getUserId();
  if (!id) redirect("/login");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/login");
  return user;
}

export async function acceptTask(taskId: string) {
  const user = await me();
  if (user.role !== "CONTRIBUTOR") redirect("/dashboard");
  const res = await db.task.updateMany({
    where: { id: taskId, status: "FUNDED", contributorId: null },
    data: { status: "ASSIGNED", contributorId: user.id },
  });
  if (res.count === 1) {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (task) await notify(db, task.orgId, "Task accepted", `${user.name} accepted "${task.title}".`, `/tasks/${taskId}`);
  }
  redirect(res.count === 1 ? `/tasks/${taskId}` : "/dashboard");
}

export async function submitWork(taskId: string, formData: FormData) {
  const user = await me();
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 1000);
  let valid = false;
  try {
    const u = new URL(evidenceUrl);
    valid = u.protocol === "https:" || u.protocol === "http:";
  } catch {}
  if (!valid) redirect(`/tasks/${taskId}?e=url`);

  await db.$transaction(async (tx) => {
    const c = await tx.task.updateMany({
      where: { id: taskId, contributorId: user.id, status: "ASSIGNED" },
      data: { status: "SUBMITTED" },
    });
    if (c.count !== 1) return;
    await tx.submission.create({ data: { taskId, contributorId: user.id, evidenceUrl, notes: notes || null } });
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (task) await notify(tx, task.orgId, "Work submitted", `${user.name} submitted work for "${task.title}".`, `/tasks/${taskId}`);
  });
  redirect(`/tasks/${taskId}`);
}

// Approval releases the reward to the contributor's balance and issues the credential, in one step.
export async function approveTask(taskId: string) {
  const user = await me();
  await db.$transaction(async (tx) => {
    const c = await tx.task.updateMany({
      where: { id: taskId, orgId: user.id, status: "SUBMITTED" },
      data: { status: "PAID" },
    });
    if (c.count !== 1) return;
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task?.contributorId) throw new Error("No contributor");
    const reference = "TL" + randomBytes(7).toString("hex");
    await tx.payment.create({
      data: { taskId, type: "PAYOUT", status: "CONFIRMED", reference, asset: "NGN", amount: String(task.rewardNgn) },
    });
    await issueCredential(tx, taskId, reference, null);
    await notify(tx, task.contributorId, "Work approved, payment released", `"${task.title}" was approved. Your balance has been credited.`, `/tasks/${taskId}`);
  });
  redirect(`/tasks/${taskId}`);
}

export async function requestChanges(taskId: string, formData: FormData) {
  const user = await me();
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (note.length < 5) redirect(`/tasks/${taskId}?e=note`);

  await db.$transaction(async (tx) => {
    const c = await tx.task.updateMany({
      where: { id: taskId, orgId: user.id, status: "SUBMITTED" },
      data: { status: "ASSIGNED" },
    });
    if (c.count !== 1) return;
    const sub = await tx.submission.findFirst({ where: { taskId }, orderBy: { createdAt: "desc" } });
    if (sub) await tx.submission.update({ where: { id: sub.id }, data: { reviewNote: note } });
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (task?.contributorId) {
      await notify(tx, task.contributorId, "Changes requested", `"${task.title}": ${note.slice(0, 120)}`, `/tasks/${taskId}`);
    }
  });
  redirect(`/tasks/${taskId}`);
}