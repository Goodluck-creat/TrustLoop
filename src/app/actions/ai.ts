"use server";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { analyzeCriteria, type ClarityItem } from "@/lib/ai";

export type ClarityResult =
  | { ok: true; mode: "preview" | "live"; items: ClarityItem[] }
  | { ok: false; error: string };

export async function checkClarity(_prev: ClarityResult | null, formData: FormData): Promise<ClarityResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Please log in." };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ORG") return { ok: false, error: "Only organizations can use this." };

  const criteria = String(formData.get("criteria") ?? "")
    .split("\n").map((c) => c.trim().slice(0, 300)).filter(Boolean).slice(0, 10);
  const title = String(formData.get("title") ?? "").slice(0, 150);
  if (criteria.length === 0) return { ok: false, error: "Add at least one acceptance criterion first." };

  try {
    const { mode, items } = await analyzeCriteria(title, criteria);
    return { ok: true, mode, items };
  } catch {
    return { ok: false, error: "The check failed. You can still create the task." };
  }
}