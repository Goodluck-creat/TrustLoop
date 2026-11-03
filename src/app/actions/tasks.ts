"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function createTask(_prev: string | null, formData: FormData) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ORG") return "Only organizations can post tasks.";

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rewardNgn = Number(formData.get("rewardNgn"));
  const deadline = new Date(String(formData.get("deadline")));
  const criteria = String(formData.get("criteria") ?? "")
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  if (title.length < 3) return "Give the task a title of at least 3 characters.";
  if (description.length < 10) return "Describe the task in at least 10 characters.";
  if (!Number.isInteger(rewardNgn) || rewardNgn < 100) return "Reward must be a whole number of at least ₦100.";
  if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) return "Pick a deadline in the future.";
  if (criteria.length < 1 || criteria.length > 10) return "Add 1 to 10 acceptance criteria, one per line.";

  await db.task.create({
    data: { title, description, rewardNgn, deadline, criteria, orgId: user.id },
  });
  redirect("/dashboard");
}