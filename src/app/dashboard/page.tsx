import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Plus, Clock, BadgeCheck, ShieldCheck, Wallet, Info, CheckCircle2, Users } from "lucide-react";
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

function TaskCard({ t, isOrg, applicants = 0 }: { t: TaskWithOrg; isOrg: boolean; applicants?: number }) {
  const s = STATUS[t.status];
  return (
    <article className={`${card} p-4 transition hover:-translate-y-0.5 hover:bg-cream sm:p-5`}>
      <div className="flex items-start gap-3">
        <Avatar name={t.org.name} src={avatarSrc(t.org)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{t.org.name}</p>
          <Link href={`/tasks/${t.id}`} className="block text-base font-bold text-ink hover:text-forest sm:text-lg">{t.title}</Link>
        </div>
        <span className={`${pill} ${s.cls}`}>{s.label}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted sm:mt-3 sm:text-sm">{t.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:mt-4 sm:gap-3 sm:text-sm">
        <span className="rounded-full bg-forest px-3 py-1 font-bold text-white sm:px-4">₦{t.rewardNgn.toLocaleString("en-NG")}</span>
        <span className="flex items-center gap-1 text-muted"><Clock className="h-4 w-4" aria-hidden />Due {t.deadline.toLocaleDateString("en-NG")}</span>
        <span className="text-muted">{t.criteria.length} criteria</span>
      </div>
      {isOrg && t.status === "FUNDED" && (
        <Link
          href={`/tasks/${t.id}`}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${applicants > 0 ? "bg-bronze text-white" : "border border-ink/15 text-muted"}`}
        >
          <Users className="h-4 w-4" aria-hidden />
          {applicants > 0 ? `Review ${applicants} applicant${applicants === 1 ? "" : "s"}` : "Waiting for applicants"}
        </Link>
      )}
      {isOrg && t.status === "AWAITING_FUNDING" && (
        <form action={startFunding.bind(null, t.id)} className="mt-4">
          <button className="rounded-xl bg-forest px-4 py-2 text-sm font-bold text-white">Fund from wallet</button>
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
    : await db.task.findMany({ where: { status: "FUNDED", contributorId: null }, include: { org: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const money = await getBalance(db, user.id);
  const withdrawals = isOrg
    ? []
    : await db.withdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });

  const counts = isOrg
    ? await db.application.groupBy({
        by: ["taskId"],
        where: { status: "PENDING", taskId: { in: mine.map((t) => t.id) } },
        _count: { _all: true },
      })
    : [];
  const countOf = (id: string) => counts.find((c) => c.taskId === id)?._count._all ?? 0;
  const myApplications = isOrg
    ? []
    : await db.application.findMany({
        where: { contributorId: user.id, status: "PENDING" },
        include: { task: { include: { org: true } } },
        orderBy: { createdAt: "desc" },
      });

  const side = "space-y-2 p-4 sm:space-y-3 sm:p-5";

  return (
    <Shell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px] lg:gap-6">
        <aside className="order-2 space-y-4 lg:order-1">
          <div className={`${card} overflow-hidden`}>
            <Cover seed={user.name} src={coverSrc(user)} className="h-16 sm:h-24" />
            <div className="-mt-8 px-5 pb-5">
              <Avatar name={user.name} src={avatarSrc(user)} className="h-16 w-16 text-xl ring-4 ring-paper" />
              <p className="mt-3 text-lg font-bold">{user.name}</p>
              <p className="text-sm text-muted">{isOrg ? "Hirer / organization" : "Freelancer / contributor"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-cream/60 py-2"><p className="text-lg font-extrabold">{followers}</p><p className="text-xs text-muted">Followers</p></div>
                <div className="rounded-2xl bg-cream/60 py-2"><p className="text-lg font-extrabold">{following}</p><p className="text-xs text-muted">Following</p></div>
              </div>
              <Link href={`/p/${user.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-cream">
                <BadgeCheck className="h-4 w-4" aria-hidden /> View Trust Passport
              </Link>
              {!isOrg && (
                <Link href="/outside-work" className="mt-2 flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-forest hover:bg-cream">
                  Add outside work
                </Link>
              )}
              <Link href="/settings/profile" className="mt-1 flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-cream">
                Edit profile pictures
              </Link>
            </div>
          </div>
        </aside>

        <section className="order-1 min-w-0 space-y-3 sm:space-y-5 lg:order-2">
          {w === "ok" && (
            <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5" aria-hidden /> Withdrawal started. Check Notifications for the result.
            </p>
          )}

          <div className="rounded-2xl bg-forest p-4 text-white shadow-xl shadow-forest/20 sm:rounded-3xl sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/80"><Wallet className="h-4 w-4" aria-hidden /> Wallet balance</p>
            <p className="mt-1 text-3xl font-extrabold sm:text-4xl">₦{money.balance.toLocaleString("en-NG")}</p>
            <p className="mt-1 text-xs text-white/80 sm:mt-2 sm:text-sm">
              {isOrg
                ? `Locked in tasks ₦${money.funded.toLocaleString("en-NG")}`
                : `Earned ₦${money.earned.toLocaleString("en-NG")} · Withdrawn ₦${money.withdrawn.toLocaleString("en-NG")}`}
            </p>
            <Link href="/wallet" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-forest hover:bg-sand sm:mt-4">
              {isOrg ? "Add money" : "Open wallet"}
            </Link>
          </div>

          {isOrg ? (
            <Link href="/tasks/new" className="flex items-center justify-center gap-2 rounded-2xl bg-bronze px-4 py-3 text-base font-bold text-white shadow-xl shadow-bronze/20 sm:rounded-3xl sm:px-6 sm:py-5 sm:text-lg">
              <Plus className="h-6 w-6" aria-hidden /> Create a task
            </Link>
          ) : (
            <>
              <div className={`${card} p-4 sm:p-5`}>
                <h2 className="mb-2 text-base font-bold sm:mb-3 sm:text-lg">Withdraw</h2>
                <WithdrawForm balance={money.balance} />
              </div>
              {withdrawals.length > 0 && (
                <div className={`${card} p-4 sm:p-5`}>
                  <h2 className="mb-2 text-base font-bold sm:mb-3 sm:text-lg">Recent withdrawals</h2>
                  <ul className="space-y-2 text-sm">
                    {withdrawals.map((x) => (
                      <li key={x.id} className="flex flex-wrap items-center justify-between gap-1 rounded-2xl bg-cream/60 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:py-3 sm:text-sm">
                        <span className="font-semibold">₦{x.amountNgn.toLocaleString("en-NG")} as {x.asset} ({x.network})</span>
                        <span className="flex items-center gap-2 text-muted">
                          {x.txHash?.startsWith("mock_") && <span className={`${pill} bg-amber-100 text-amber-800 ring-amber-600/20`}>Sandbox</span>}
                          {x.status === "COMPLETED" ? "Sent" : x.status === "FAILED" ? "Failed" : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!isOrg && myApplications.length > 0 && (
            <>
              <h2 className="text-lg font-bold sm:text-xl">My applications</h2>
              {myApplications.map((a) => (
                <Link key={a.id} href={`/tasks/${a.taskId}`} className={`${card} flex items-center justify-between gap-3 p-3 text-sm hover:bg-cream sm:p-4`}>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.task.title}</span>
                    <span className="block truncate text-xs text-muted">{a.task.org.name} · waiting for the hirer</span>
                  </span>
                  <span className={`${pill} bg-amber-100 text-amber-800 ring-amber-600/20`}>Pending</span>
                </Link>
              ))}
            </>
          )}

          <h2 className="text-lg font-bold sm:text-xl">{isOrg ? "Your tasks" : "My work"}</h2>
          {mine.length === 0 && (
            <p className={`${card} p-6 text-muted`}>{isOrg ? "No tasks yet. Create your first one." : "You have no active tasks yet. Apply for one below."}</p>
          )}
          {mine.map((t) => (<TaskCard key={t.id} t={t} isOrg={isOrg} applicants={countOf(t.id)} />))}

          {!isOrg && (
            <>
              <h2 className="pt-1 text-lg font-bold sm:pt-2 sm:text-xl">Open tasks</h2>
              {open.length === 0 && <p className={`${card} p-6 text-muted`}>No open tasks right now. Check back soon.</p>}
              {open.map((t) => (<TaskCard key={t.id} t={t} isOrg={false} />))}
            </>
          )}
        </section>

        <aside className="order-3 space-y-4">
          <div className={`${card} ${side}`}>
            <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-forest" aria-hidden /> How it works</p>
            <p className="text-sm text-muted">
              {isOrg
                ? "Add money to your wallet and fund a task from it. Contributors apply, you review their records and choose one. When you approve the work, the reward is released instantly."
                : "Apply for tasks that fit you. The hirer reads your Trust Passport and picks one person. When your work is approved, the reward lands in your wallet instantly."}
            </p>
          </div>
          <div className={`${card} ${side}`}>
            <p className="flex items-center gap-2 font-bold"><Info className="h-5 w-5 text-amber-700" aria-hidden /> Sandbox mode</p>
            <p className="text-sm text-muted">Payments are simulated while Roqqu sandbox access is pending. No real money moves.</p>
          </div>
          <div className={`${card} ${side}`}>
            <p className="font-bold">Tips</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
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
