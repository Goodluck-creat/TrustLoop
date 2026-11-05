import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, ExternalLink, BadgeCheck, PencilLine, Wallet, Users } from "lucide-react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import TrustBadges from "@/components/TrustBadges";
import PaymentTrail from "@/components/PaymentTrail";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { avatarSrc } from "@/lib/images";
import { trustSummary } from "@/lib/trust";
import { submitWork, approveTask, requestChanges } from "@/app/actions/work";
import { applyToTask, withdrawApplication, assignApplicant, declineApplicant } from "@/app/actions/applications";
import { STATUS, pill, card, input } from "@/lib/ui";

export const instant = false;

const errors: Record<string, string> = {
  url: "Enter a valid link starting with https://",
  note: "Write at least 5 characters explaining what to change.",
};
const steps = ["Funded", "Assigned", "Submitted", "Approved and paid"];
const current: Record<string, number> = { AWAITING_FUNDING: -1, FUNDED: 0, ASSIGNED: 1, SUBMITTED: 2, APPROVED: 3, PAID: 3 };
const primary = "flex w-full items-center justify-center gap-2 rounded-xl bg-forest text-white hover:bg-[#0d2d25] px-5 py-3 font-bold text-white shadow-lg shadow-forest/20";

export default async function TaskPage({
  params,
  searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const { id } = await params;
  const { e } = await searchParams;

  const [user, task] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.task.findUnique({
      where: { id },
      include: { org: true, contributor: true, credential: true, submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);
  if (!user || !task) notFound();

  const isOwner = task.orgId === user.id;
  const isAssigned = task.contributorId === user.id;
  const myApp =
    user.role === "CONTRIBUTOR" && !isOwner
      ? await db.application.findUnique({ where: { taskId_contributorId: { taskId: task.id, contributorId: user.id } } })
      : null;
  const canApply = user.role === "CONTRIBUTOR" && task.status === "FUNDED" && !isOwner && (!myApp || myApp.status === "WITHDRAWN");
  if (!isOwner && !isAssigned && !canApply && !myApp) notFound();

  const applicants =
    isOwner && task.status === "FUNDED"
      ? await db.application.findMany({
          where: { taskId: task.id, status: "PENDING" },
          include: { contributor: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const summaries = await Promise.all(applicants.map((a) => trustSummary(a.contributorId)));

  const last = task.submissions[0];
  const s = STATUS[task.status];
  const cur = current[task.status];

  return (
    <Shell>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className={`${card} p-6`}>
            <div className="flex items-start gap-4">
              <Avatar name={task.org.name} src={avatarSrc(task.org)} className="h-14 w-14 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">
                  <Link href={`/p/${task.org.id}`} className="font-semibold text-forest hover:underline">{task.org.name}</Link>
                </p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{task.title}</h1>
              </div>
              <span className={`${pill} ${s.cls}`}>{s.label}</span>
            </div>
            <p className="mt-4 whitespace-pre-line text-ink/80">{task.description}</p>
            <h2 className="mt-6 font-bold">Acceptance criteria</h2>
            <ul className="mt-2 space-y-2">
              {task.criteria.map((c) => (
                <li key={c} className="flex items-start gap-3 rounded-2xl bg-cream/60 px-4 py-3 text-ink">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />{c}
                </li>
              ))}
            </ul>
          </div>

          {e && errors[e] && <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">{errors[e]}</p>}

          {canApply && (
            <form action={applyToTask.bind(null, task.id)} className={`${card} space-y-3 p-6`}>
              <h2 className="text-lg font-bold">Apply for this task</h2>
              <p className="text-sm text-muted">The hirer will see your Trust Passport, including your verified work, and chooses who does the task.</p>
              <textarea name="note" rows={3} maxLength={500} placeholder="Why are you a good fit? (optional)" className={input} />
              <button className={primary}>Apply</button>
            </form>
          )}

          {myApp?.status === "PENDING" && (
            <div className={`${card} space-y-3 p-6`}>
              <p className="font-bold">Application sent</p>
              <p className="text-sm text-muted">The hirer is reviewing applicants. You will get a notification when they choose.</p>
              <form action={withdrawApplication.bind(null, task.id)}>
                <button className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-cream">Withdraw application</button>
              </form>
            </div>
          )}
          {myApp?.status === "DECLINED" && !isAssigned && (
            <p className={`${card} p-6 text-muted`}>This task went to another applicant. Keep applying, every verified job strengthens your passport.</p>
          )}

          {isOwner && task.status === "FUNDED" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xl font-bold"><Users className="h-5 w-5" aria-hidden /> Applicants ({applicants.length})</h2>
              {applicants.length === 0 && (
                <p className={`${card} p-6 text-muted`}>No applicants yet. Contributors can see this task on their dashboard. You will be notified when someone applies.</p>
              )}
              {applicants.map((a, i) => (
                <article key={a.id} className={`${card} space-y-4 p-5`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.contributor.name} src={avatarSrc(a.contributor)} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/p/${a.contributor.id}`} className="block truncate font-bold text-forest hover:underline">{a.contributor.name}</Link>
                      <p className="text-xs text-muted">Applied {a.createdAt.toLocaleDateString("en-NG")}</p>
                    </div>
                    <Link href={`/p/${a.contributor.id}`} className="text-xs font-semibold text-muted underline hover:text-ink">Full passport</Link>
                  </div>
                  {a.contributor.bio && <p className="whitespace-pre-line text-sm text-ink/80">{a.contributor.bio}</p>}
                  {a.note && <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm">{a.note}</p>}
                  <TrustBadges s={summaries[i]} />
                  <div className="grid grid-cols-2 gap-3">
                    <form action={assignApplicant.bind(null, a.id)}>
                      <button className={primary}>Assign this person</button>
                    </form>
                    <form action={declineApplicant.bind(null, a.id)}>
                      <button className="w-full rounded-xl border border-ink/20 px-5 py-3 font-semibold hover:bg-cream">Decline</button>
                    </form>
                  </div>
                </article>
              ))}
            </section>
          )}

          {isAssigned && task.status === "ASSIGNED" && last?.reviewNote && (
            <div className="rounded-3xl border border-amber-400/50 bg-amber-50 p-5">
              <p className="flex items-center gap-2 font-bold text-amber-800"><PencilLine className="h-5 w-5" aria-hidden /> Changes requested</p>
              <p className="mt-2 whitespace-pre-line text-ink">{last.reviewNote}</p>
            </div>
          )}

          {isAssigned && task.status === "ASSIGNED" && (
            <form action={submitWork.bind(null, task.id)} className={`${card} space-y-3 p-6`}>
              <h2 className="text-lg font-bold">{last?.reviewNote ? "Submit your updated work" : "Submit your work"}</h2>
              <input name="evidenceUrl" placeholder="Link to your work (https://...)" required className={input} />
              <textarea name="notes" rows={3} placeholder="Notes for the reviewer (optional)" className={input} />
              <button className={primary}>Submit work</button>
            </form>
          )}

          {last && (isOwner || isAssigned) && (
            <div className={`${card} space-y-2 p-6`}>
              <h2 className="text-lg font-bold">Latest submission</h2>
              <a href={last.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all font-semibold text-forest underline">
                {last.evidenceUrl} <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              </a>
              {last.notes && <p className="text-muted">{last.notes}</p>}
            </div>
          )}

          {isOwner && task.status === "SUBMITTED" && (
            <div className={`${card} space-y-5 p-6`}>
              <form action={approveTask.bind(null, task.id)} className="space-y-2">
                <h2 className="text-lg font-bold">Review this work</h2>
                <button className={primary}>Approve and release ₦{task.rewardNgn.toLocaleString("en-NG")}</button>
                <p className="text-xs text-muted">The contributor is paid immediately and a verified credential is issued.</p>
              </form>
              <form action={requestChanges.bind(null, task.id)} className="space-y-3 border-t border-ink/10 pt-5">
                <label className="block font-semibold" htmlFor="note">Or request changes</label>
                <textarea id="note" name="note" rows={3} required minLength={5} placeholder="Explain what needs to change" className={input} />
                <button className="w-full rounded-xl border border-ink/20 px-5 py-3 font-semibold text-ink hover:bg-cream">Send request</button>
              </form>
            </div>
          )}

          {task.status === "PAID" && (isOwner || isAssigned) && <PaymentTrail taskId={task.id} showAmounts />}

          {task.status === "PAID" && (
            <div className="space-y-3 rounded-3xl bg-sage/30 p-6 ring-1 ring-emerald-600/20">
              <p className="flex items-center gap-2 font-bold text-emerald-800">
                <Wallet className="h-5 w-5" aria-hidden />
                {isOwner ? `Payment released to ${task.contributor?.name ?? "the contributor"}` : "Payment released to your wallet"}
              </p>
              {task.credential && (
                <Link href={`/verify/${task.credential.id}`} className="inline-flex items-center gap-2 font-semibold text-forest underline">
                  <BadgeCheck className="h-5 w-5" aria-hidden /> View the verified credential
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-forest text-white p-6 shadow-xl shadow-forest/20">
            <p className="text-sm font-semibold text-white/80">Reward</p>
            <p className="text-4xl font-extrabold">₦{task.rewardNgn.toLocaleString("en-NG")}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><Clock className="h-4 w-4" aria-hidden /> Due {task.deadline.toLocaleDateString("en-NG")}</p>
          </div>
          <div className={`${card} p-5`}>
            <p className="mb-3 font-bold">Progress</p>
            <ol className="space-y-3">
              {steps.map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= cur ? "bg-emerald-400 text-emerald-950" : "bg-cream text-muted"}`}>
                    {i <= cur ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={i <= cur ? "font-semibold" : "text-muted"}>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
