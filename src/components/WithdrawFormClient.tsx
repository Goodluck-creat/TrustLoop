"use client";

import { useActionState, useState } from "react";
import { requestWithdrawal } from "@/app/actions/withdraw";

const NETWORKS: Record<string, string[]> = { USDT: ["TRC20", "BEP20"], USDC: ["BASE"] };
const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const field = "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-forest";

export default function WithdrawFormClient({ balance, feePercent }: { balance: number; feePercent: number }) {
  const [error, action, pending] = useActionState(requestWithdrawal, null);
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const n = Math.floor(Number(amount)) || 0;
  const fee = Math.round((n * feePercent) / 100);
  const net = n - fee;

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted">Available: <b className="text-ink">{naira(balance)}</b></p>
      <div>
        <label htmlFor="amountNgn" className="mb-1 block text-sm font-semibold">Amount in naira</label>
        <input id="amountNgn" name="amountNgn" type="number" min={100} step={1} max={balance} required inputMode="numeric"
          value={amount} onChange={(e) => setAmount(e.target.value)} className={field} placeholder="e.g. 5000" />
      </div>

      <div className="rounded-xl bg-cream px-4 py-3 text-sm" aria-live="polite">
        {feePercent > 0 ? (
          <>
            <p className="font-semibold">TrustLoop charges {feePercent}% when you withdraw.</p>
            {n >= 100 ? (
              <p className="mt-1 text-muted">Fee {naira(fee)}. You receive <b className="text-ink">{naira(net)}</b> as {asset}.</p>
            ) : (
              <p className="mt-1 text-muted">Enter an amount to see exactly what you will receive.</p>
            )}
          </>
        ) : (
          <p className="font-semibold">There is no withdrawal fee right now.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="asset" className="mb-1 block text-sm font-semibold">Asset</label>
          <select id="asset" name="asset" value={asset} onChange={(e) => setAsset(e.target.value)} className={field}>
            {Object.keys(NETWORKS).map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="network" className="mb-1 block text-sm font-semibold">Network</label>
          <select id="network" name="network" key={asset} className={field}>
            {NETWORKS[asset].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-semibold">Your wallet address</label>
        <input id="address" name="address" required minLength={26} maxLength={64} autoComplete="off" spellCheck={false} className={`${field} font-mono text-sm`} placeholder="Paste the address that receives the money" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-forest px-5 py-3 font-bold text-white disabled:opacity-60">
        {pending ? "Sending..." : "Withdraw"}
      </button>
    </form>
  );
}
