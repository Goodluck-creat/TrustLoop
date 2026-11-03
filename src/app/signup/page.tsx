"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800";

export default function SignupPage() {
  const [error, formAction, pending] = useActionState(signup, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
        <input name="name" placeholder="Name or organization" required className={field} />
        <input name="email" type="email" placeholder="Email" required className={field} />
        <input name="password" type="password" placeholder="Password (8+ characters)" required className={field} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-600">I want to</legend>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800">
            <input type="radio" name="role" value="ORG" defaultChecked /> Post tasks (Organization)
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800">
            <input type="radio" name="role" value="CONTRIBUTOR" /> Complete tasks (Contributor)
          </label>
        </fieldset>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Creating..." : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-indigo-700">Log in</Link>
        </p>
      </form>
    </main>
  );
}