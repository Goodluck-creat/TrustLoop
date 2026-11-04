import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Lock, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import AddMoneyForm from "@/components/AddMoneyForm";
import CopyButton from "@/components/CopyButton";
import { createMyWalletAddress } from "@/app/actions/wallet";

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const LABEL: Record<string, string> = {
  DEPOSIT: "Money added",
  TASK_FUND: "Locked for a task",
  TASK_PAYOUT: "Task payment received",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Withdrawal reversed",
};

type Search = Promise<{ need?: string; task?: string; added?: string }>;

export default function WalletPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted">Loading your wallet...</div>}>
      <WalletInner searchParams={searchParams} />
    </Suspense>
  );
}

async function WalletInner({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const [bal, entries] = await Promise.all([
    getBalance(db, userId),
    db.ledgerEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const sandbox = process.env.ROQQU_ENV !== "live";
  const need = Math.max(100, Number(sp.need) || 0);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard
      </Link>

      {sp.added && (
        <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          Payment received. Your wallet has been updated.
        </p>
      )}
      {sp.need && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Your wallet is {naira(Number(sp.need) || 0)} short for that task. Add money, then fund the task again.
        </p>
      )}

      <section className="rounded-3xl bg-forest p-6 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Wallet className="h-4 w-4" aria-hidden /> Wallet balance
        </p>
        <p className="mt-2 text-4xl font-extrabold">{naira(bal.balance)}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-white/70">Added</p><p className="font-bold">{naira(bal.deposited)}</p></div>
          <div><p className="text-white/70">Earned</p><p className="font-bold">{naira(bal.earned)}</p></div>
          <div><p className="text-white/70">Locked in tasks</p><p className="font-bold">{naira(bal.funded)}</p></div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-bold">Add money</h2>
          <p className="mt-1 text-sm text-muted">
            Top up your wallet, then fund tasks from it. {sandbox ? "Sandbox: a simulator stands in for the Roqqu payment page." : "You pay on Roqqu's secure payment page."}
          </p>
          <div className="mt-4">
            <AddMoneyForm defaultAmount={need} sandbox={sandbox} />
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-bold">Your Roqqu wallet address</h2>
          {user.depositAddress ? (
            <>
              <p className="mt-1 text-sm text-muted">
                USDT on {(user.depositNetwork ?? "trc20").toUpperCase()}.{" "}
                {user.depositSandbox
                  ? "This is a simulated sandbox address and exists on no real network."
                  : sandbox
                    ? "Created by Roqqu on its test environment."
                    : "Created by Roqqu for your account."}
              </p>
              <p className="mt-3 break-all rounded-xl bg-cream px-3 py-2 font-mono text-xs">{user.depositAddress}</p>
              <div className="mt-3"><CopyButton text={user.depositAddress} /></div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Your address is being created. If it does not appear, create it now.</p>
              <form action={createMyWalletAddress} className="mt-3">
                <button className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-cream">Create my address</button>
              </form>
            </>
          )}
          <p className="mt-4 text-sm text-muted">
            To withdraw to your own wallet, use the withdraw form on your <Link href="/dashboard" className="font-semibold text-forest underline">dashboard</Link>.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
        <h2 className="text-lg font-bold">Activity</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing yet. Add money to get started.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10">
            {entries.map((e) => {
              const credit = e.amountNgn > 0;
              const Icon = e.type === "TASK_FUND" ? Lock : credit ? ArrowDownLeft : ArrowUpRight;
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream">
                      <Icon className="h-4 w-4 text-forest" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{LABEL[e.type] ?? e.type}</span>
                      <span className="block truncate text-xs text-muted">
                        {e.note ? e.note + " · " : ""}
                        {e.createdAt.toLocaleDateString("en-NG")}
                      </span>
                    </span>
                  </span>
                  <span className={`shrink-0 font-bold ${credit ? "text-emerald-700" : "text-ink"}`}>
                    {credit ? "+" : "-"}{naira(Math.abs(e.amountNgn))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
