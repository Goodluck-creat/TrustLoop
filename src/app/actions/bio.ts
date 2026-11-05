"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

// Saves the signed-in person's public bio (up to 300 characters).
export async function updateBio(formData: FormData) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const bio = String(formData.get("bio") ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 300);
  await db.user.update({ where: { id: userId }, data: { bio: bio || null } });
  redirect(`/p/${userId}`);
}
