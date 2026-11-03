"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const MAX_BYTES = 400_000;
const isKind = (k: string): k is "avatar" | "cover" => k === "avatar" || k === "cover";

export async function saveImage(kind: string, _prev: string | null, formData: FormData) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  if (!isKind(kind)) return "Invalid image type.";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return "Choose an image first.";
  if (file.size > MAX_BYTES) return "That image is too large. Try a smaller one.";
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return "Unsupported image. Choose a JPG or PNG photo.";

  await db.userImage.upsert({
    where: { userId_kind: { userId, kind } },
    create: { userId, kind, data: bytes },
    update: { data: bytes },
  });
  await db.user.update({
    where: { id: userId },
    data: kind === "avatar" ? { avatarAt: new Date() } : { coverAt: new Date() },
  });
  redirect("/settings/profile?saved=1");
}

export async function removeImage(kind: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  if (!isKind(kind)) redirect("/settings/profile");
  await db.userImage.deleteMany({ where: { userId, kind } });
  await db.user.update({
    where: { id: userId },
    data: kind === "avatar" ? { avatarAt: null } : { coverAt: null },
  });
  redirect("/settings/profile");
}