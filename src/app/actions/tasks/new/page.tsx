"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTask } from "@/app/actions/tasks";

const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800";

export default function NewTaskPage() {
  const [error, formAction, pending] = useActionState(createTask, null);
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <form action={formAction} className="mx-auto max-w-xl space-y-4 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
        <Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800">Create a task</h1>
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
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving..." : "Create task"}
        </button>
      </form>
    </main>
  );
}