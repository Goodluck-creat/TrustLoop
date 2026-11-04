import { db } from "@/lib/db";
import type { CheckReport } from "@/lib/authenticity";

export type ExternalLevel = "DISPUTED" | "CONFIRMED" | "CHECKED" | "SELF";

export function externalLevel(w: { check: unknown; refereeResponse: string | null }): ExternalLevel {
  if (w.refereeResponse === "DISPUTED") return "DISPUTED";
  if (w.refereeResponse === "CONFIRMED") return "CONFIRMED";
  const c = w.check as Partial<CheckReport> | null;
  return c && c.passed ? "CHECKED" : "SELF";
}

export type TrustSummary = {
  verified: number;
  hirers: number;
  recent: string[];
  external: { title: string; level: ExternalLevel }[];
};

// Everything a hirer needs to judge an applicant, in one place.
export async function trustSummary(userId: string): Promise<TrustSummary> {
  const [verified, issuers, recent, ext] = await Promise.all([
    db.credential.count({ where: { contributorId: userId } }),
    db.credential.groupBy({ by: ["issuerId"], where: { contributorId: userId } }),
    db.credential.findMany({
      where: { contributorId: userId },
      include: { task: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.externalWork.findMany({
      where: { userId },
      select: { title: true, check: true, refereeResponse: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return {
    verified,
    hirers: issuers.length,
    recent: recent.map((c) => c.task.title),
    external: ext.map((w) => ({ title: w.title, level: externalLevel(w) })),
  };
}
