"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

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
  redirect(res.count === 1 ? `/tasks/${taskId}` : `/tasks/${taskId}?e=taken`);
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
    await tx.submission.create({
      data: { taskId, contributorId: user.id, evidenceUrl, notes: notes || null },
    });
  });
  redirect(`/tasks/${taskId}`);
}

export async function reviewTask(taskId: string, decision: "approve" | "changes") {
  const user = await me();
  await db.task.updateMany({
    where: { id: taskId, orgId: user.id, status: "SUBMITTED" },
    data: { status: decision === "approve" ? "APPROVED" : "ASSIGNED" },
  });
  redirect(`/tasks/${taskId}`);
}