import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Lock, Wallet, ShieldCheck, ExternalLink, RefreshCw, Gauge } from "lucide-react";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import AddMoneyForm from "@/components/AddMoneyForm";
import CopyButton from "@/components/CopyButton";
import { createAddress, checkMyRoqquStatus, checkWithdrawal, recoverWithdrawal } from "@/app/actions/roqqu";
import { listDepositAddresses, NETWORKS } from "@/lib/wallet";
import { getNgnPerUsdt } from "@/lib/payments/rates";
import { getSendFee } from "@/lib/payments/fees";
import { isLiveMode } from "@/lib/payments/client";
import { explorerUrl } from "@/lib/proof";

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const LABEL: Record<string, string> = {
  DEPOSIT: "Money added",
  TASK_FUND: "Locked for a task",
  TASK_PAYOUT: "Task payment received",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Withdrawal returned",
};
const W_STATUS: Record<string, [string, string]> = {
  PENDING: ["Starting", "bg-cream text-muted"],
  PROCESSING: ["Sending", "bg-amber-50 text-amber-800"],
  COMPLETED: ["Sent", "bg-emerald-100 text-emerald-800"],
  FAILED: ["Returned to wallet", "bg-cream text-muted"],
  REFUND_REQUESTED: ["Refund requested", "bg-amber-50 text-amber-800"],
};
const MESSAGES: Record<string, [boolean, string]> = {
  withdrawn: [true, "Withdrawal started. You will be notified when it is sent."],
  address: [true, "Your address is ready."],
  badnet: [false, "That network is not supported."],
  sandbox: [true, "Sandbox mode: there is no Roqqu account to check yet."],
  unreachable: [false, "Could not reach Roqqu just now. Please try again in a moment."],
  status_verified: [true, "Your Roqqu account is verified. A badge now shows on your Trust Passport."],
  status_unverified: [true, "Your Roqqu account exists but is not verified yet."],
  status_not_found: [false, "Roqqu has no account for this email yet."],
  status_blacklisted: [false, "Roqqu has blocked this account. Please contact support."],
  nosend: [false, "This withdrawal cannot be checked."],
  nowd: [false, "Withdrawal not found."],
  pending: [true, "Roqqu has not put this transfer on the blockchain yet. Check again shortly."],
  confirmed: [true, "Confirmed. The transfer is on the blockchain."],
  notstuck: [false, "This withdrawal is not stuck."],
  toosoon: [false, "Roqqu only allows a refund an hour after the transfer was started."],
  refund_denied: [false, "Roqqu did not accept the refund yet. It only refunds transfers that failed on the blockchain."],
  refund_ok: [true, "Refund requested. Your balance will be restored when Roqqu confirms it."],
};

type Search = Promise<{ need?: string; task?: string; added?: string; m?: string }>;

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

  const [bal, entries, addresses, withdrawals, rate, fee] = await Promise.all([
    getBalance(db, userId),
    db.ledgerEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 15 }),
    listDepositAddresses(userId),
    db.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 }),
    getNgnPerUsdt(),
    getSendFee(),
  ]);
  const sandbox = process.env.ROQQU_ENV !== "live";
  const live = isLiveMode();
  const need = Math.max(100, Number(sp.need) || 0);
  const note = sp.m ? MESSAGES[sp.m] : undefined;
  const statusText: Record<string, string> = {
    verified: "Verified on Roqqu",
    unverified: "On Roqqu, not verified yet",
    not_found: "Not found on Roqqu",
    blacklisted: "Blocked by Roqqu",
  };

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard
      </Link>

      {sp.added && (
        <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          Payment received. Your wallet will update as soon as Roqqu confirms it.
        </p>
      )}
      {note && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${note[0] ? "bg-emerald-100 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {note[1]}
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
            Top up your wallet, then fund tasks from it.{" "}
            {sandbox ? "Sandbox: a simulator stands in for the Roqqu payment page." : "You pay on Roqqu's secure payment page and can choose Bitcoin or USDT."}
          </p>
          <div className="mt-4">
            <AddMoneyForm defaultAmount={need} sandbox={sandbox} />
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-bold">Your Roqqu wallet addresses</h2>
          <p className="mt-1 text-sm text-muted">
            Send USDT to one of these from any wallet and your balance goes up by itself.
          </p>
          <div className="mt-3 space-y-3">
            {NETWORKS.map((n) => {
              const a = addresses.find((x) => x.network === n);
              return (
                <div key={n}>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">USDT on {n.toUpperCase()}</p>
                  {a ? (
                    <>
                      <p className="mt-1 break-all rounded-xl bg-cream px-3 py-2 font-mono text-xs">{a.address}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <CopyButton text={a.address} />
                        {a.sandbox && <span className="text-xs text-muted">Simulated sandbox address. It exists on no real network.</span>}
                      </div>
                    </>
                  ) : (
                    <form action={createAddress.bind(null, n)} className="mt-1">
                      <button className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-cream">Create {n.toUpperCase()} address</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Gauge className="h-5 w-5 text-forest" aria-hidden /> Rate, fees and your Roqqu account</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Price of 1 USDT</dt>
            <dd className="font-bold">{naira(Math.round(rate.rate))}</dd>
            <dd className="text-xs text-muted">{rate.source === "roqqu" ? "Live rate from Roqqu" : live ? "Roqqu rate unavailable, using the set rate" : "Fixed sandbox rate"}</dd>
          </div>
          <div>
            <dt className="text-muted">Roqqu withdrawal fee</dt>
            <dd className="font-bold">{fee?.percentage != null ? `${fee.percentage}%` : fee?.fee != null ? `${fee.fee} USDT` : "Shown once live"}</dd>
            <dd className="text-xs text-muted">Charged by Roqqu when the transfer is sent</dd>
          </div>
          <div>
            <dt className="text-muted">Roqqu account</dt>
            <dd className="flex items-center gap-1 font-bold"><ShieldCheck className="h-4 w-4 text-forest" aria-hidden />{user.roqquStatus ? statusText[user.roqquStatus] ?? "Checked" : "Not checked"}</dd>
            <dd>
              <form action={checkMyRoqquStatus}>
                <button className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-forest underline"><RefreshCw className="h-3 w-3" aria-hidden /> Check now</button>
              </form>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">
          To withdraw to your own wallet, use the withdraw form on your <Link href="/dashboard" className="font-semibold text-forest underline">dashboard</Link>.
        </p>
      </section>

      {withdrawals.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-bold">Withdrawals</h2>
          <ul className="mt-3 divide-y divide-ink/10">
            {withdrawals.map((w) => {
              const [label, tone] = W_STATUS[w.status] ?? [w.status, "bg-cream text-muted"];
              const url = explorerUrl(w.network, w.txHash);
              const old = Date.now() - w.createdAt.getTime() > 60 * 60 * 1000;
              return (
                <li key={w.id} className="space-y-2 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{naira(w.amountNgn)} · {w.asset} on {w.network}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>
                  </div>
                  {w.txHash && (
                    <p className="break-all text-xs text-muted">
                      {w.txHash.startsWith("mock_") ? "Sandbox transfer (no blockchain record)" : w.txHash}
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-forest underline">
                          View <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </p>
                  )}
                  {w.status === "PROCESSING" && w.refid && (
                    <div className="flex flex-wrap gap-3">
                      <form action={checkWithdrawal.bind(null, w.reference)}>
                        <button className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-cream">Check status</button>
                      </form>
                      {old && (
                        <form action={recoverWithdrawal.bind(null, w.reference)}>
                          <button className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-cream">Transfer stuck? Request refund</button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
