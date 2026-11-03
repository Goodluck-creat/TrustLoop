"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTask } from "@/app/actions/tasks";
import { checkClarity } from "@/app/actions/ai";

const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800";

export default function NewTaskPage() {
  const [error, formAction, pending] = useActionState(createTask, null);
  const [check, checkAction, checking] = useActionState(checkClarity, null);
  const vague = check && check.ok ? check.items.filter((i) => i.verdict === "vague").length : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10 text-slate-800">
      <form action={formAction} className="mx-auto max-w-xl space-y-4 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
        <Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Back</Link>
        <h1 className="text-2xl font-bold">Create a task</h1>
        <label className="block text-sm font-semibold text-slate-600">Title
          <input name="title" required className={`${field} mt-1`} placeholder="Design a logo for our community" />
        </label>
        <label className="block text-sm font-semibold text-slate-600">Description
          <textarea name="description" required rows={4} className={`${field} mt-1`} placeholder="What needs to be done?" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-600">Reward (₦)
            <input name="rewardNgn" type="number" min={100} step={1} required className={`${field} mt-1`} placeholder="20000" />
          </label>
          <label className="block text-sm font-semibold text-slate-600">Deadline
            <input name="deadline" type="date" required className={`${field} mt-1`} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-600">Acceptance criteria (one per line)
          <textarea name="criteria" required rows={4} className={`${field} mt-1`} placeholder={"Delivered as PNG and SVG\nIncludes 2 colour versions"} />
        </label>

        <button type="submit" formAction={checkAction} formNoValidate disabled={checking}
          className="w-full rounded-xl border border-indigo-600 bg-white px-4 py-3 font-semibold text-indigo-700 disabled:opacity-60">
          {checking ? "Analyzing your criteria..." : "✨ Check clarity with AI"}
        </button>

        {check && !check.ok && <p role="alert" className="text-sm font-semibold text-red-700">{check.error}</p>}
        {check && check.ok && (
          <div className="space-y-3 rounded-2xl bg-indigo-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-indigo-900">
                {vague === 0 ? "All criteria look checkable" : `${vague} of ${check.items.length} criteria need work`}
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                {check.mode === "live" ? "AI review" : "Preview mode"}
              </span>
            </div>
            {check.items.map((i, n) => (
              <div key={n} className="text-sm">
                <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-bold ${i.verdict === "clear" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                  {i.verdict === "clear" ? "Clear" : "Vague"}
                </span>
                {i.criterion}
                {i.suggestion && <p className="ml-1 mt-1 text-slate-700">Try: {i.suggestion}</p>}
              </div>
            ))}
            <p className="text-xs text-slate-500">Suggestions only. You decide what to publish.</p>
          </div>
        )}

        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving..." : "Create task"}
        </button>
      </form>
    </main>
  );
}