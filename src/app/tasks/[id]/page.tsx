import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { acceptTask, submitWork, reviewTask } from "@/app/actions/work";
import { startPayout } from "@/app/actions/payments";

export const instant = false;

const errors: Record<string, string> = {
  url: "Enter a valid link starting with https://",
  taken: "Someone else already accepted this task.",
};
const status: Record<string, string> = {
  AWAITING_FUNDING: "Unfunded", FUNDED: "Funded", ASSIGNED: "In progress",
  SUBMITTED: "Submitted", APPROVED: "Approved", PAID: "Paid",
};
const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800";
const btn = "rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white";

export default async function TaskPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const { id } = await params;
  const { e } = await searchParams;

  const [user, task] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.task.findUnique({
      where: { id },
      include: { org: true, credential: true, submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);
  if (!user || !task) notFound();

  const isOwner = task.orgId === user.id;
  const isAssigned = task.contributorId === user.id;
  const canAccept = user.role === "CONTRIBUTOR" && task.status === "FUNDED";
  if (!isOwner && !isAssigned && !canAccept) notFound();

  const last = task.submissions[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Back</Link>

        <div className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{task.title}</h1>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">{status[task.status]}</span>
          </div>
          <p className="text-sm text-slate-500">By {task.org.name} · Due {task.deadline.toLocaleDateString("en-NG")}</p>
          <p className="text-2xl font-extrabold text-indigo-700">₦{task.rewardNgn.toLocaleString("en-NG")}</p>
          <p className="whitespace-pre-line text-slate-700">{task.description}</p>
          <div>
            <p className="font-semibold text-slate-800">Acceptance criteria</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
              {task.criteria.map((c) => (<li key={c}>{c}</li>))}
            </ul>
          </div>
        </div>

        {e && errors[e] && <p role="alert" className="text-sm font-semibold text-red-700">{errors[e]}</p>}

        {canAccept && (
          <form action={acceptTask.bind(null, task.id)}>
            <button className={`${btn} w-full`}>Accept this task</button>
          </form>
        )}

        {isAssigned && task.status === "ASSIGNED" && (
          <form action={submitWork.bind(null, task.id)} className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
            <h2 className="font-bold text-slate-800">Submit your work</h2>
            <input name="evidenceUrl" placeholder="Link to your work (https://...)" required className={field} />
            <textarea name="notes" rows={3} placeholder="Notes for the reviewer (optional)" className={field} />
            <button className={`${btn} w-full`}>Submit work</button>
          </form>
        )}

        {last && (isOwner || isAssigned) && (
          <div className="space-y-1 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
            <h2 className="font-bold text-slate-800">Latest submission</h2>
            <a href={last.evidenceUrl} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-indigo-700 underline">{last.evidenceUrl}</a>
            {last.notes && <p className="text-slate-600">{last.notes}</p>}
          </div>
        )}

        {isOwner && task.status === "SUBMITTED" && (
          <div className="flex gap-3">
            <form action={reviewTask.bind(null, task.id, "approve")} className="flex-1">
              <button className={`${btn} w-full`}>Approve</button>
            </form>
            <form action={reviewTask.bind(null, task.id, "changes")} className="flex-1">
              <button className="w-full rounded-xl border border-indigo-600 bg-white px-5 py-3 font-semibold text-indigo-700">Request changes</button>
            </form>
          </div>
        )}

        {task.status === "APPROVED" && isOwner && (
  <form action={startPayout.bind(null, task.id)}>
    <button className={`${btn} w-full`}>Pay ₦{task.rewardNgn.toLocaleString("en-NG")} to the contributor</button>
  </form>
)}
{task.status === "APPROVED" && !isOwner && (
  <p className="rounded-2xl bg-emerald-100 p-4 font-semibold text-emerald-900">Approved. Waiting for payout.</p>
)}
{task.status === "PAID" && task.credential && (
  <Link href={`/verify/${task.credential.id}`} className="block rounded-2xl bg-emerald-100 p-4 text-center font-semibold text-emerald-900 underline">
    Paid. View the verified credential →
  </Link>
)}
      </div>
    </main>
  );
}