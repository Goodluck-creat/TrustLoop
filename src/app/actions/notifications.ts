"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function markAllRead() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  redirect("/notifications");
}