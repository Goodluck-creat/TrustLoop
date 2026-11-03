"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
        <input name="email" type="email" placeholder="Email" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
        <input name="password" type="password" placeholder="Password" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Logging in..." : "Log in"}
        </button>
        <p className="text-center text-sm text-slate-600">
          New here? <Link href="/signup" className="font-semibold text-indigo-700">Create an account</Link>
        </p>
      </form>
    </main>
  );
}