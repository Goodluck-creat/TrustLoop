import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Activity, Wallet, ArrowDownLeft, ArrowUpRight, RotateCcw, Radio } from "lucide-react";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { isLiveMode, isProdKey, roqquRequest, asRecord } from "@/lib/payments/client";
import { getNgnPerUsdt } from "@/lib/payments/rates";

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

export default function RoqquAdminPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted">Loading...</div>}>
      <Inner />
    </Suspense>
  );
}

// Only the emails in ADMIN_EMAILS (comma separated) can open this page.
async function Inner() {
  const userId = await getUserId();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const me = userId ? await db.user.findUnique({ where: { id: userId }, select: { email: true } }) : null;
  if (!me || !admins.includes(me.email.toLowerCase())) notFound();

  const [addrRows, legacyOnly, deps, ledger, wds, byKind, lastEvent, recent, rate] = await Promise.all([
    db.depositAddress.groupBy({ by: ["sandbox"], _count: true }),
    db.user.count({ where: { depositAddress: { not: null }, addresses: { none: {} } } }),
    db.deposit.groupBy({ by: ["status"], _count: true, _sum: { amountNgn: true } }),
    db.ledgerEntry.groupBy({ by: ["type"], _count: true, _sum: { amountNgn: true } }),
    db.withdrawal.groupBy({ by: ["status"], _count: true, _sum: { amountNgn: true } }),
    db.roqquTx.groupBy({ by: ["kind", "live"], _count: true, _sum: { amountNgn: true } }),
    db.webhookEvent.findFirst({ where: { type: { startsWith: "roqqu_" } }, orderBy: { processedAt: "desc" } }),
    db.roqquTx.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    getNgnPerUsdt(),
  ]);

  // Roqqu's own numbers for our account, only when live.
  let stats: Record<string, unknown> | null = null;
  if (isLiveMode()) {
    try {
      stats = asRecord(await roqquRequest("GET", "/analytics/stats", { timeoutMs: 8000 }));
    } catch {
      stats = null;
    }
  }

  const real = addrRows.filter((r) => !r.sandbox).reduce((a, r) => a + r._count, 0);
  const sim = addrRows.filter((r) => r.sandbox).reduce((a, r) => a + r._count, 0) + legacyOnly;
  const dep = (s: string) => deps.find((d) => d.status === s);
  const led = (t: string) => ledger.find((l) => l.type === t);
  const wd = (s: string) => wds.find((w) => w.status === s);
  const kind = (k: string, live: boolean) => byKind.find((b) => b.kind === k && b.live === live);
  const mode = isLiveMode() ? (isProdKey() ? "Live" : "Roqqu test environment") : "Simulator";

  const tiles: [string, string, string, typeof Wallet][] = [
    ["Wallet addresses made", String(real + sim), `${real} on Roqqu, ${sim} simulated`, Wallet],
    ["Top-ups confirmed", String(dep("CONFIRMED")?._count ?? 0), naira(dep("CONFIRMED")?._sum.amountNgn ?? 0), ArrowDownLeft],
    ["Paid to freelancers", String(led("TASK_PAYOUT")?._count ?? 0), naira(led("TASK_PAYOUT")?._sum.amountNgn ?? 0), Activity],
    ["Withdrawals sent", String(wd("COMPLETED")?._count ?? 0), naira(wd("COMPLETED")?._sum.amountNgn ?? 0), ArrowUpRight],
    ["Withdrawals in progress", String((wd("PROCESSING")?._count ?? 0) + (wd("REFUND_REQUESTED")?._count ?? 0)), "Waiting on Roqqu", Radio],
    ["Returned to wallets", String((wd("FAILED")?._count ?? 0)), naira(wd("FAILED")?._sum.amountNgn ?? 0), RotateCcw],
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold">Roqqu activity</h1>
        <p className="mt-1 text-sm text-muted">
          Counts come from TrustLoop's own records of every Roqqu call and webhook. Mode: <b>{mode}</b>. Price of 1 USDT: <b>{naira(Math.round(rate.rate))}</b> ({rate.source === "roqqu" ? "live from Roqqu" : "fixed"}).
        </p>
        <p className="mt-1 text-sm text-muted">
          Last Roqqu webhook received: <b>{lastEvent ? lastEvent.processedAt.toLocaleString("en-NG") : "none yet"}</b>
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, big, small, Icon]) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm shadow-ink/5">
            <Icon className="h-5 w-5 text-forest" aria-hidden />
            <p className="mt-2 text-2xl font-extrabold">{big}</p>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted">{small}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
        <h2 className="text-lg font-bold">Confirmed by Roqqu webhooks</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="py-1">Event</th><th>Live</th><th>Test or simulated</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {[
              ["PAYMENT_LINK", "Payment links paid"],
              ["CHAIN_DEPOSIT", "USDT sent to user addresses"],
              ["SEND", "Withdrawals sent on-chain"],
              ["REFUND", "Failed sends refunded"],
            ].map(([k, label]) => (
              <tr key={k}>
                <td className="py-2 font-semibold">{label}</td>
                <td>{kind(k, true)?._count ?? 0}</td>
                <td>{kind(k, false)?._count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {stats && (
        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-bold">Roqqu's own numbers for TrustLoop</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            {(["total_volume", "total_credit", "total_debit"] as const).map((k) => (
              <div key={k}>
                <dt className="text-muted">{k.replace("total_", "Total ")}</dt>
                <dd className="text-xl font-extrabold">{String(stats?.[k] ?? "-")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
        <h2 className="text-lg font-bold">Latest events</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No Roqqu events yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><b>{r.kind.replace("_", " ").toLowerCase()}</b> · {r.status.toLowerCase()}{r.network ? ` · ${r.network}` : ""}</span>
                <span className="text-xs text-muted">{r.live ? "live" : "test"} · {r.createdAt.toLocaleString("en-NG")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
