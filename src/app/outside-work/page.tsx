import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, RefreshCw, Trash2, Info } from "lucide-react";
import Shell from "@/components/Shell";
import ExternalWorkForm from "@/components/ExternalWorkForm";
import CopyLink from "@/components/CopyLink";
import { LevelPill } from "@/components/TrustBadges";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { externalLevel } from "@/lib/trust";
import type { CheckReport } from "@/lib/authenticity";
import { recheckExternal, deleteExternal } from "@/app/actions/external";
import { card } from "@/lib/ui";

export const instant = false;

export default async function OutsideWork({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const { added } = await searchParams;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  const works = await db.externalWork.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  return (
    <Shell>
      <Link href={`/p/${userId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to my Trust Passport
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Outside work</h1>
            <p className="mt-1 text-muted">
              Add work you did before TrustLoop. We run automatic checks on your link, and a referee can confirm it. It appears on your passport with a clear level of evidence.
            </p>
          </div>

          {added && (
            <p role="status" className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
              Added. Read the check result below, then send the referee link to someone who can vouch for this work.
            </p>
          )}

          {works.length === 0 && <p className={`${card} p-6 text-muted`}>Nothing added yet.</p>}
          {works.map((w) => {
            const report = w.check as unknown as CheckReport | null;
            const level = externalLevel(w);
            let host = "";
            try { host = new URL(w.evidenceUrl).hostname; } catch {}
            return (
              <article key={w.id} className={`${card} space-y-3 p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-bold">{w.title}</h2>
                  <LevelPill level={level} />
                </div>
                <p className="text-sm text-ink/80">{w.description}</p>
                <a href={w.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-forest underline">
                  {host || w.evidenceUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </a>
                {w.clientName && <p className="text-xs text-muted">Client: {w.clientName}</p>}

                {report && (
                  <div className="rounded-2xl bg-cream/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Automatic check</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {report.notes.map((n, i) => (<li key={i}>{n}</li>))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-ink/10 p-4">
                  <p className="text-sm font-bold">Referee</p>
                  {w.respondedAt ? (
                    <p className="mt-1 text-sm">
                      {w.refereeResponse === "CONFIRMED" ? "Confirmed" : "Disputed"} by <b>{w.refereeName}</b>
                      {w.refereeComment ? `: "${w.refereeComment}"` : "."}
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-muted">
                        Send this private link to a past client, manager or teammate who can vouch for the work. They do not need an account.
                      </p>
                      <div className="mt-2"><CopyLink path={`/attest/${w.refereeToken}`} label="Copy referee link" /></div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={recheckExternal.bind(null, w.id)}>
                    <button className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-cream">
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Run check again
                    </button>
                  </form>
                  <form action={deleteExternal.bind(null, w.id)}>
                    <button className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <h2 className="mb-3 text-lg font-bold">Add outside work</h2>
            <ExternalWorkForm />
          </div>
          <div className={`${card} space-y-2 p-5 text-sm`}>
            <p className="flex items-center gap-2 font-bold"><Info className="h-4 w-4 text-forest" aria-hidden /> What the levels mean</p>
            <ul className="space-y-1 text-muted">
              <li><b className="text-ink">Self-reported:</b> you added it, nothing found yet.</li>
              <li><b className="text-ink">Link checked:</b> the link loads and shows signs of this work.</li>
              <li><b className="text-ink">Confirmed by referee:</b> someone else vouched for it by name.</li>
            </ul>
            <p className="text-muted">Outside work is never marked as verified on TrustLoop. Only work approved and signed on the platform is.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
