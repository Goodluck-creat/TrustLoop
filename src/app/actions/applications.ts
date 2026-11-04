"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { notify } from "@/lib/notify";

async function me() {
  const id = await getUserId();
  if (!id) redirect("/login");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/login");
  return user;
}

// A contributor asks to do a funded task. The hirer chooses who gets it.
export async function applyToTask(taskId: string, formData: FormData) {
  const user = await me();
  if (user.role !== "CONTRIBUTOR") redirect("/dashboard");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.status !== "FUNDED" || task.contributorId || task.orgId === user.id) redirect("/dashboard");

  const existing = await db.application.findUnique({
    where: { taskId_contributorId: { taskId, contributorId: user.id } },
  });
  if (existing && existing.status !== "WITHDRAWN") redirect(`/tasks/${taskId}`);

  await db.$transaction(async (tx) => {
    if (existing) {
      await tx.application.update({ where: { id: existing.id }, data: { status: "PENDING", note: note || null, createdAt: new Date() } });
    } else {
      await tx.application.create({ data: { taskId, contributorId: user.id, note: note || null } });
    }
    await notify(tx, task.orgId, "New application", `${user.name} applied for "${task.title}".`, `/tasks/${taskId}`);
  });
  redirect(`/tasks/${taskId}`);
}

export async function withdrawApplication(taskId: string) {
  const user = await me();
  await db.application.updateMany({
    where: { taskId, contributorId: user.id, status: "PENDING" },
    data: { status: "WITHDRAWN" },
  });
  redirect(`/tasks/${taskId}`);
}

// The hirer picks one applicant. The task becomes theirs; everyone else is told.
export async function assignApplicant(applicationId: string) {
  const user = await me();
  const app = await db.application.findUnique({ where: { id: applicationId }, include: { task: true } });
  if (!app || app.task.orgId !== user.id || app.status !== "PENDING") redirect("/dashboard");

  await db.$transaction(async (tx) => {
    const claimed = await tx.task.updateMany({
      where: { id: app.taskId, orgId: user.id, status: "FUNDED", contributorId: null },
      data: { status: "ASSIGNED", contributorId: app.contributorId },
    });
    if (claimed.count !== 1) return;
    await tx.application.update({ where: { id: app.id }, data: { status: "ACCEPTED" } });
    const others = await tx.application.findMany({ where: { taskId: app.taskId, status: "PENDING", id: { not: app.id } } });
    await tx.application.updateMany({ where: { taskId: app.taskId, status: "PENDING", id: { not: app.id } }, data: { status: "DECLINED" } });
    await notify(tx, app.contributorId, "You were selected", `${user.name} chose you for "${app.task.title}". You can start now.`, `/tasks/${app.taskId}`);
    for (const o of others) {
      await notify(tx, o.contributorId, "Not selected", `"${app.task.title}" went to another applicant. Keep applying, your record counts.`, `/tasks/${app.taskId}`);
    }
  });
  redirect(`/tasks/${app.taskId}`);
}

export async function declineApplicant(applicationId: string) {
  const user = await me();
  const app = await db.application.findUnique({ where: { id: applicationId }, include: { task: true } });
  if (!app || app.task.orgId !== user.id || app.status !== "PENDING") redirect("/dashboard");
  await db.$transaction(async (tx) => {
    await tx.application.update({ where: { id: app.id }, data: { status: "DECLINED" } });
    await notify(tx, app.contributorId, "Application not selected", `Your application for "${app.task.title}" was not selected.`, `/tasks/${app.taskId}`);
  });
  redirect(`/tasks/${app.taskId}`);
}
