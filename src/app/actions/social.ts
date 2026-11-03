"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function toggleFollow(targetId: string) {
  const me = await getUserId();
  if (!me) redirect("/login");
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (target && me !== targetId) {
    const key = { followerId: me, followingId: targetId };
    const existing = await db.follow.findUnique({ where: { followerId_followingId: key } });
    if (existing) await db.follow.delete({ where: { followerId_followingId: key } });
    else await db.follow.create({ data: key });
  }
  redirect(`/p/${targetId}`);
}