"use client";

import { useActionState, useState } from "react";
import { startDeposit } from "@/app/actions/wallet";

const CHIPS = [5000, 20000, 50000];

export default function AddMoneyForm({ defaultAmount, sandbox }: { defaultAmount: number; sandbox: boolean }) {
  const [error, action, pending] = useActionState(startDeposit, null);
  const [amount, setAmount] = useState(String(defaultAmount));

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-semibold" htmlFor="amountNgn">Amount in naira</label>
      <input
        id="amountNgn"
        name="amountNgn"
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-forest"
      />
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setAmount(String(c))}
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold hover:bg-cream"
          >
            ₦{c.toLocaleString("en-NG")}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0d2d25] disabled:opacity-60"
      >
        {pending ? "Starting payment..." : sandbox ? "Add money (sandbox)" : "Add money with Roqqu"}
      </button>
    </form>
  );
}
