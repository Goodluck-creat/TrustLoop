import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { startFunding } from "@/app/actions/payments";

export const instant = false;

const label: Record<string, { text: string; cls: string }> = {
  AWAITING_FUNDING: { text: "Unfunded", cls: "bg-red-100 text-red-800" },
  FUNDED: { text: "Funded", cls: "bg-emerald-100 text-emerald-800" },
  ASSIGNED: { text: "In progress", cls: "bg-indigo-100 text-indigo-800" },
  SUBMITTED: { text: "Submitted", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { text: "Approved", cls: "bg-emerald-100 text-emerald-800" },
  PAID: { text: "Paid", cls: "bg-emerald-100 text-emerald-800" },
};

export default async function Dashboard() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const isOrg = user.role === "ORG";
  const tasks = await db.task.findMany({
    where: isOrg
  ? { orgId: user.id }
  : { OR: [{ status: "FUNDED" }, { contributorId: user.id }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Hi, {user.name}</h1>
          <form action={logout}>
            <button className="rounded-xl bg-white px-4 py-2 font-semibold text-indigo-700 shadow-sm">Log out</button>
          </form>
        </div>

        {isOrg && (
          <Link href="/tasks/new" className="block rounded-2xl bg-indigo-600 px-6 py-4 text-center font-semibold text-white shadow-lg">
            + Create a task
          </Link>
        )}
    <Link href={`/p/${user.id}`} className="block rounded-2xl border border-indigo-200 bg-white/70 px-6 py-3 text-center font-semibold text-indigo-700">
  View my Trust Passport
</Link>
        <h2 className="text-lg font-bold text-slate-800">{isOrg ? "Your tasks" : "Open funded tasks"}</h2>
        {tasks.length === 0 && (
          <p className="rounded-2xl border border-white/80 bg-white/70 p-6 text-slate-600">
            {isOrg ? "No tasks yet. Create your first one." : "No funded tasks yet. Check back soon."}
          </p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/tasks/${t.id}`} className="font-bold text-indigo-700 underline">{t.title}</Link>
                <p className="text-sm text-slate-500">Due {t.deadline.toLocaleDateString("en-NG")}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${label[t.status].cls}`}>{label[t.status].text}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-indigo-700">₦{t.rewardNgn.toLocaleString("en-NG")}</p>
            {isOrg && t.status === "AWAITING_FUNDING" && (
              <form action={startFunding.bind(null, t.id)} className="mt-3">
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Fund this task</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}