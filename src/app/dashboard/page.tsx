import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Plus, Clock, BadgeCheck, ShieldCheck, Wallet, Info, CheckCircle2 } from "lucide-react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import WithdrawForm from "@/components/WithdrawForm";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import { avatarSrc, coverSrc } from "@/lib/images";
import { startFunding } from "@/app/actions/payments";
import { STATUS, pill, card } from "@/lib/ui";

export const instant = false;

type TaskWithOrg = Prisma.TaskGetPayload<{ include: { org: true } }>;

function TaskCard({ t, isOrg }: { t: TaskWithOrg; isOrg: boolean }) {
  const s = STATUS[t.status];
  return (
    <article className={`${card} p-5 transition hover:-translate-y-0.5 hover:bg-white/10`}>
      <div className="flex items-start gap-3">
        <Avatar name={t.org.name} src={avatarSrc(t.org)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-300">{t.org.name}</p>
          <Link href={`/tasks/${t.id}`} className="block text-lg font-bold text-white hover:text-violet-200">{t.title}</Link>
        </div>
        <span className={`${pill} ${s.cls}`}>{s.label}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-300">{t.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-1 font-bold">₦{t.rewardNgn.toLocaleString("en-NG")}</span>
        <span className="flex items-center gap-1 text-slate-300"><Clock className="h-4 w-4" aria-hidden />Due {t.deadline.toLocaleDateString("en-NG")}</span>
        <span className="text-slate-400">{t.criteria.length} criteria</span>
      </div>
      {isOrg && t.status === "AWAITING_FUNDING" && (
        <form action={startFunding.bind(null, t.id)} className="mt-4">
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-900">Fund this task</button>
        </form>
      )}
    </article>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  const { w } = await searchParams;
  const isOrg = user.role === "ORG";

  const followers = await db.follow.count({ where: { followingId: user.id } });
  const following = await db.follow.count({ where: { followerId: user.id } });
  const mine = await db.task.findMany({
    where: isOrg ? { orgId: user.id } : { contributorId: user.id },
    include: { org: true },
    orderBy: { createdAt: "desc" },
  });
  const open = isOrg
    ? []
    : await db.task.findMany({ where: { status: "FUNDED" }, include: { org: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const money = isOrg ? null : await getBalance(db, user.id);
  const withdrawals = isOrg
    ? []
    : await db.withdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });

  const side = "space-y-3 p-5";

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <aside className="space-y-4">
          <div className={`${card} overflow-hidden`}>
            <Cover seed={user.name} src={coverSrc(user)} className="h-24" />
            <div className="-mt-8 px-5 pb-5">
              <Avatar name={user.name} src={avatarSrc(user)} className="h-16 w-16 text-xl ring-4 ring-[#0B0B2B]" />
              <p className="mt-3 text-lg font-bold">{user.name}</p>
              <p className="text-sm text-slate-300">{isOrg ? "Hirer / organization" : "Freelancer / contributor"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-white/5 py-2"><p className="text-lg font-extrabold">{followers}</p><p className="text-xs text-slate-300">Followers</p></div>
                <div className="rounded-2xl bg-white/5 py-2"><p className="text-lg font-extrabold">{following}</p><p className="text-xs text-slate-300">Following</p></div>
              </div>
              <Link href={`/p/${user.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                <BadgeCheck className="h-4 w-4" aria-hidden /> View Trust Passport
              </Link>
              <Link href="/settings/profile" className="mt-2 flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10">
                Edit profile pictures
              </Link>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          {w === "ok" && (
            <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-200">
              <CheckCircle2 className="h-5 w-5" aria-hidden /> Withdrawal started. Check Notifications for the result.
            </p>
          )}

          {isOrg ? (
            <Link href="/tasks/new" className="flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-6 py-5 text-lg font-bold shadow-xl shadow-violet-900/40">
              <Plus className="h-6 w-6" aria-hidden /> Create a task
            </Link>
          ) : (
            money && (
              <>
                <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-6 shadow-xl shadow-violet-900/40">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white/80"><Wallet className="h-4 w-4" aria-hidden /> Available balance</p>
                  <p className="mt-1 text-4xl font-extrabold">₦{money.balance.toLocaleString("en-NG")}</p>
                  <p className="mt-2 text-sm text-white/80">
                    Earned ₦{money.earned.toLocaleString("en-NG")} · Withdrawn ₦{money.withdrawn.toLocaleString("en-NG")}
                  </p>
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="mb-3 text-lg font-bold">Withdraw</h2>
                  <WithdrawForm balance={money.balance} />
                </div>
                {withdrawals.length > 0 && (
                  <div className={`${card} p-5`}>
                    <h2 className="mb-3 text-lg font-bold">Recent withdrawals</h2>
                    <ul className="space-y-2 text-sm">
                      {withdrawals.map((x) => (
                        <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3">
                          <span className="font-semibold">₦{x.amountNgn.toLocaleString("en-NG")} as {x.asset} ({x.network})</span>
                          <span className="flex items-center gap-2 text-slate-300">
                            {x.txHash?.startsWith("mock_") && <span className={`${pill} bg-amber-400/15 text-amber-200 ring-amber-300/30`}>Sandbox</span>}
                            {x.status === "COMPLETED" ? "Sent" : x.status === "FAILED" ? "Failed" : "Pending"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )
          )}

          <h2 className="text-xl font-bold">{isOrg ? "Your tasks" : "My work"}</h2>
          {mine.length === 0 && (
            <p className={`${card} p-6 text-slate-300`}>{isOrg ? "No tasks yet. Create your first one." : "You have not accepted any tasks yet."}</p>
          )}
          {mine.map((t) => (<TaskCard key={t.id} t={t} isOrg={isOrg} />))}

          {!isOrg && (
            <>
              <h2 className="pt-2 text-xl font-bold">Open tasks</h2>
              {open.length === 0 && <p className={`${card} p-6 text-slate-300`}>No open tasks right now. Check back soon.</p>}
              {open.map((t) => (<TaskCard key={t.id} t={t} isOrg={false} />))}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className={`${card} ${side}`}>
            <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-cyan-300" aria-hidden /> How it works</p>
            <p className="text-sm text-slate-300">
              {isOrg
                ? "Fund a task and the reward is reserved. When you approve the work, it is released to the contributor instantly."
                : "When your work is approved, the reward lands in your balance instantly. You can withdraw to a wallet at any time."}
            </p>
          </div>
          <div className={`${card} ${side}`}>
            <p className="flex items-center gap-2 font-bold"><Info className="h-5 w-5 text-amber-300" aria-hidden /> Sandbox mode</p>
            <p className="text-sm text-slate-300">Payments are simulated while Roqqu sandbox access is pending. No real money moves.</p>
          </div>
          <div className={`${card} ${side}`}>
            <p className="font-bold">Tips</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              <li>Write criteria a reviewer can check.</li>
              <li>Submit links that stay online.</li>
              <li>Give specific feedback when asking for changes.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Shell>
  );
}