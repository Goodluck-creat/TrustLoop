"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { createTask } from "@/app/actions/tasks";
import { checkClarity } from "@/app/actions/ai";
import { input } from "@/lib/ui";

const lab = "mb-1 block text-sm font-semibold text-slate-200";

export default function NewTaskForm() {
  const [error, formAction, pending] = useActionState(createTask, null);
  const [check, checkAction, checking] = useActionState(checkClarity, null);
  const vague = check && check.ok ? check.items.filter((i) => i.verdict === "vague").length : 0;

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
      <label className="block"><span className={lab}>Title</span>
        <input name="title" required className={input} placeholder="Design a logo for our community" />
      </label>
      <label className="block"><span className={lab}>Description</span>
        <textarea name="description" required rows={4} className={input} placeholder="What needs to be done?" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className={lab}>Reward (₦)</span>
          <input name="rewardNgn" type="number" min={100} step={1} required className={input} placeholder="20000" />
        </label>
        <label className="block"><span className={lab}>Deadline</span>
          <input name="deadline" type="date" required className={`${input} [color-scheme:dark]`} />
        </label>
      </div>
      <label className="block"><span className={lab}>Acceptance criteria (one per line)</span>
        <textarea name="criteria" required rows={4} className={input} placeholder={"Delivered as PNG and SVG\nIncludes 2 colour versions"} />
      </label>

      <button
        type="submit"
        formAction={checkAction}
        formNoValidate
        disabled={checking}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/50 px-4 py-3 font-semibold text-violet-100 hover:bg-white/10 disabled:opacity-60"
      >
        {checking ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Analyzing your criteria...</> : <><Sparkles className="h-5 w-5" aria-hidden /> Check clarity with AI</>}
      </button>

      {check && !check.ok && <p role="alert" className="rounded-xl bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-200">{check.error}</p>}
      {check && check.ok && (
        <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">{vague === 0 ? "All criteria look checkable" : `${vague} of ${check.items.length} criteria need work`}</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">{check.mode === "live" ? "AI review" : "Preview mode"}</span>
          </div>
          {check.items.map((i, n) => (
            <div key={n} className="text-sm">
              <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${i.verdict === "clear" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                {i.verdict === "clear" ? "Clear" : "Vague"}
              </span>
              {i.criterion}
              {i.suggestion && <p className="mt-1 text-slate-300">Try: {i.suggestion}</p>}
            </div>
          ))}
          <p className="text-xs text-slate-400">Suggestions only. You decide what to publish.</p>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-900/40 disabled:opacity-60">
        {pending ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Saving...</> : "Create task"}
      </button>
    </form>
  );
}