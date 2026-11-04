"use server";

import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { notify } from "@/lib/notify";
import { runAuthenticityCheck } from "@/lib/authenticity";

async function runCheck(workId: string) {
  const w = await db.externalWork.findUnique({ where: { id: workId }, include: { user: true } });
  if (!w) return;
  const sharedWith = await db.externalWork.count({ where: { evidenceUrl: w.evidenceUrl, userId: { not: w.userId } } });
  const report = await runAuthenticityCheck({ url: w.evidenceUrl, personName: w.user.name, projectTitle: w.title });
  if (sharedWith > 0) {
    report.notes.push(`Note: ${sharedWith} other TrustLoop member${sharedWith === 1 ? " lists" : "s list"} this same link. That can be normal for team work.`);
  }
  const data = JSON.parse(JSON.stringify({ ...report, sharedWith })) as Prisma.InputJsonObject;
  await db.externalWork.update({ where: { id: w.id }, data: { check: data, checkedAt: new Date() } });
}

export async function addExternalWork(_prev: string | null, formData: FormData): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim().slice(0, 80);

  if (title.length < 3 || title.length > 80) return "Give the work a title of 3 to 80 characters.";
  if (description.length < 10 || description.length > 600) return "Describe what you did in 10 to 600 characters.";
  try {
    const u = new URL(evidenceUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad");
  } catch {
    return "Enter a link that starts with https://";
  }
  if (evidenceUrl.length > 300) return "That link is too long.";
  if ((await db.externalWork.count({ where: { userId } })) >= 20) return "You can list up to 20 pieces of outside work.";

  const work = await db.externalWork.create({
    data: {
      userId,
      title,
      description,
      evidenceUrl,
      clientName: clientName || null,
      refereeToken: randomBytes(18).toString("hex"),
    },
  });
  await runCheck(work.id);
  redirect("/outside-work?added=1");
}

export async function recheckExternal(id: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const w = await db.externalWork.findUnique({ where: { id } });
  if (w && w.userId === userId) await runCheck(id);
  redirect("/outside-work");
}

export async function deleteExternal(id: string) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  await db.externalWork.deleteMany({ where: { id, userId } });
  redirect("/outside-work");
}

// Public: a referee (past client or manager) confirms or disputes the work.
export async function submitAttestation(token: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 500);
  const response = formData.get("response") === "DISPUTED" ? "DISPUTED" : "CONFIRMED";

  if (name.length < 2) redirect(`/attest/${token}?e=name`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/attest/${token}?e=email`);

  const w = await db.externalWork.findUnique({ where: { refereeToken: token }, include: { user: true } });
  if (!w) redirect("/");
  if (w.respondedAt) redirect(`/attest/${token}`);

  const viewer = await getUserId();
  if (viewer === w.userId || email === w.user.email.toLowerCase()) redirect(`/attest/${token}?e=self`);

  const res = await db.externalWork.updateMany({
    where: { id: w.id, respondedAt: null },
    data: { refereeName: name, refereeEmail: email, refereeComment: comment || null, refereeResponse: response, respondedAt: new Date() },
  });
  if (res.count === 1) {
    await notify(
      db,
      w.userId,
      response === "CONFIRMED" ? "Outside work confirmed" : "Outside work disputed",
      `${name} ${response === "CONFIRMED" ? "confirmed" : "disputed"} "${w.title}".`,
      "/outside-work",
    );
  }
  redirect(`/attest/${token}?done=1`);
}
