"use client";

import { useActionState } from "react";
import { addExternalWork } from "@/app/actions/external";
import { input } from "@/lib/ui";

export default function ExternalWorkForm() {
  const [error, action, pending] = useActionState(addExternalWork, null);
  return (
    <form action={action} className="space-y-3">
      <input name="title" placeholder="What was the work? (for example, Brand identity for a bakery)" required maxLength={80} className={input} />
      <textarea name="description" rows={3} placeholder="What did you do, and what was the result?" required minLength={10} maxLength={600} className={input} />
      <input name="evidenceUrl" placeholder="Link to the work (https://...)" required className={input} />
      <input name="clientName" placeholder="Client or employer (optional)" maxLength={80} className={input} />
      {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-[#0d2d25] disabled:opacity-60"
      >
        {pending ? "Adding and checking the link..." : "Add and check"}
      </button>
    </form>
  );
}
