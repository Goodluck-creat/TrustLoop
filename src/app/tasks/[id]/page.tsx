import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, ExternalLink, BadgeCheck, PencilLine, Wallet } from "lucide-react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { avatarSrc } from "@/lib/images";
import { acceptTask, submitWork, approveTask, requestChanges } from "@/app/actions/work";
import { STATUS, pill, card, input } from "@/lib/ui";

export const instant = false;

const errors: Record<string, string> = {
  url: "Enter a valid link starting with https://",
  note: "Write at least 5 characters explaining what to change.",
};
const steps = ["Funded", "Accepted", "Submitted", "Approved and paid"];
const current: Record<string, number> = { AWAITING_FUNDING: -1, FUNDED: 0, ASSIGNED: 1, SUBMITTED: 2, APPROVED: 3, PAID: 3 };
const primary = "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-900/40";

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
  const canAccept = user.role === "CONTRIBUTOR" && task.status === "FUNDED";
  if (!isOwner && !isAssigned && !canAccept) notFound();

  const last = task.submissions[0];
  const s = STATUS[task.status];
  const cur = current[task.status];

  return (
    <Shell>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className={`${card} p-6`}>
            <div className="flex items-start gap-4">
              <Avatar name={task.org.name} src={avatarSrc(task.org)} className="h-14 w-14 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-300">
                  <Link href={`/p/${task.org.id}`} className="font-semibold text-violet-200 hover:underline">{task.org.name}</Link>
                </p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{task.title}</h1>
              </div>
              <span className={`${pill} ${s.cls}`}>{s.label}</span>
            </div>
            <p className="mt-4 whitespace-pre-line text-slate-200">{task.description}</p>
            <h2 className="mt-6 font-bold">Acceptance criteria</h2>
            <ul className="mt-2 space-y-2">
              {task.criteria.map((c) => (
                <li key={c} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 text-slate-100">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />{c}
                </li>
              ))}
            </ul>
          </div>

          {e && errors[e] && <p role="alert" className="rounded-2xl bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-200">{errors[e]}</p>}

          {canAccept && (
            <form action={acceptTask.bind(null, task.id)}>
              <button className={primary}>Accept this task</button>
            </form>
          )}

          {isAssigned && task.status === "ASSIGNED" && last?.reviewNote && (
            <div className="rounded-3xl border border-amber-300/30 bg-amber-400/10 p-5">
              <p className="flex items-center gap-2 font-bold text-amber-200"><PencilLine className="h-5 w-5" aria-hidden /> Changes requested</p>
              <p className="mt-2 whitespace-pre-line text-slate-100">{last.reviewNote}</p>
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
              <a href={last.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all font-semibold text-violet-200 underline">
                {last.evidenceUrl} <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              </a>
              {last.notes && <p className="text-slate-300">{last.notes}</p>}
            </div>
          )}

          {isOwner && task.status === "SUBMITTED" && (
            <div className={`${card} space-y-5 p-6`}>
              <form action={approveTask.bind(null, task.id)} className="space-y-2">
                <h2 className="text-lg font-bold">Review this work</h2>
                <button className={primary}>Approve and release ₦{task.rewardNgn.toLocaleString("en-NG")}</button>
                <p className="text-xs text-slate-400">The contributor is paid immediately and a verified credential is issued.</p>
              </form>
              <form action={requestChanges.bind(null, task.id)} className="space-y-3 border-t border-white/10 pt-5">
                <label className="block font-semibold" htmlFor="note">Or request changes</label>
                <textarea id="note" name="note" rows={3} required minLength={5} placeholder="Explain what needs to change" className={input} />
                <button className="w-full rounded-xl border border-white/25 px-5 py-3 font-semibold text-white hover:bg-white/10">Send request</button>
              </form>
            </div>
          )}

          {task.status === "PAID" && (
            <div className="space-y-3 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-6 ring-1 ring-emerald-300/30">
              <p className="flex items-center gap-2 font-bold text-emerald-200">
                <Wallet className="h-5 w-5" aria-hidden />
                {isOwner ? `Payment released to ${task.contributor?.name ?? "the contributor"}` : "Payment released to your balance"}
              </p>
              {task.credential && (
                <Link href={`/verify/${task.credential.id}`} className="inline-flex items-center gap-2 font-semibold text-white underline">
                  <BadgeCheck className="h-5 w-5" aria-hidden /> View the verified credential
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-6 shadow-xl shadow-violet-900/40">
            <p className="text-sm font-semibold text-white/80">Reward</p>
            <p className="text-4xl font-extrabold">₦{task.rewardNgn.toLocaleString("en-NG")}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><Clock className="h-4 w-4" aria-hidden /> Due {task.deadline.toLocaleDateString("en-NG")}</p>
          </div>
          <div className={`${card} p-5`}>
            <p className="mb-3 font-bold">Progress</p>
            <ol className="space-y-3">
              {steps.map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= cur ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-slate-300"}`}>
                    {i <= cur ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={i <= cur ? "font-semibold" : "text-slate-400"}>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </Shell>
  );
}