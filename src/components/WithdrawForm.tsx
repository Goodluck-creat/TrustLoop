"use client";

import { useActionState, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { requestWithdrawal } from "@/app/actions/withdraw";
import { input } from "@/lib/ui";

const NETWORKS: Record<string, string[]> = { USDC: ["BASE"], USDT: ["TRC20", "BEP20"] };
const lab = "mb-1 block text-xs font-semibold text-slate-300";

export default function WithdrawForm({ balance }: { balance: number }) {
  const [error, action, pending] = useActionState(requestWithdrawal, null);
  const [asset, setAsset] = useState("USDC");

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className={lab}>Amount (₦)</span>
          <input name="amountNgn" type="number" min={100} max={balance} step={1} required placeholder="2000" className={input} />
        </label>
        <label className="block"><span className={lab}>Asset</span>
          <select name="asset" value={asset} onChange={(e) => setAsset(e.target.value)} className={`${input} [&>option]:text-slate-900`}>
            {Object.keys(NETWORKS).map((a) => (<option key={a}>{a}</option>))}
          </select>
        </label>
        <label className="block"><span className={lab}>Network</span>
          <select name="network" key={asset} defaultValue={NETWORKS[asset][0]} className={`${input} [&>option]:text-slate-900`}>
            {NETWORKS[asset].map((n) => (<option key={n}>{n}</option>))}
          </select>
        </label>
      </div>
      <label className="block"><span className={lab}>Wallet address</span>
        <input name="address" required placeholder="Paste your wallet address" className={input} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-rose-300">{error}</p>}
      <button disabled={pending || balance < 100} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-indigo-900 disabled:opacity-50">
        {pending ? "Sending..." : <>Withdraw <ArrowUpRight className="h-5 w-5" aria-hidden /></>}
      </button>
      <p className="text-xs text-slate-400">Sandbox mode: no real funds move. Live conversion uses Roqqu&apos;s rate once connected.</p>
    </form>
  );
}