"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function toggleFollow(targetId: string) {
  const me = await getUserId();
  if (!me) redirect("/login");
  const [target, self] = await Promise.all([
    db.user.findUnique({ where: { id: targetId } }),
    db.user.findUnique({ where: { id: me } }),
  ]);
  if (target && self && me !== targetId) {
    const key = { followerId: me, followingId: targetId };
    const existing = await db.follow.findUnique({ where: { followerId_followingId: key } });
    if (existing) {
      await db.follow.delete({ where: { followerId_followingId: key } });
    } else {
      await db.follow.create({ data: key });
      await notify(db, targetId, "New follower", `${self.name} started following you.`, `/p/${me}`);
    }
  }
  redirect(`/p/${targetId}`);
}