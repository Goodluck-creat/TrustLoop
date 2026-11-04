"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, Eye, EyeOff, Loader2, UserRound } from "lucide-react";
import { login, signup } from "@/app/actions/auth";
import { input } from "@/lib/ui";

const panel = "space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8";
const submit =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-900/40 disabled:opacity-60";

function PasswordField({ placeholder, autoComplete }: { placeholder: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name="password"
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label="Password"
        className={`${input} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-300 hover:text-white"
      >
        {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  );
}

function RoleOption({ value, title, text, Icon, checked }: { value: string; title: string; text: string; Icon: typeof Building2; checked?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name="role" value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="flex h-full flex-col gap-1.5 rounded-2xl border border-white/15 bg-white/5 p-4 transition peer-checked:border-violet-400 peer-checked:bg-violet-500/20 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400">
        <Icon className="h-6 w-6 text-violet-300" aria-hidden />
        <span className="font-bold">{title}</span>
        <span className="text-xs text-slate-300">{text}</span>
      </span>
    </label>
  );
}

export function SignupForm() {
  const [error, action, pending] = useActionState(signup, null);
  return (
    <form action={action} className={panel}>
      <div>
        <h1 className="text-2xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-300">It takes under a minute.</p>
      </div>
      <input name="name" required autoComplete="name" aria-label="Name or organization" placeholder="Name or organization" className={input} />
      <input name="email" type="email" required autoComplete="email" aria-label="Email" placeholder="Email" className={input} />
      <PasswordField placeholder="Password (8+ characters)" autoComplete="new-password" />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-200">I want to</legend>
        <div className="grid grid-cols-2 gap-3">
          <RoleOption value="ORG" title="Hire" text="Post tasks and pay for approved work" Icon={Building2} checked />
          <RoleOption value="CONTRIBUTOR" title="Work" text="Complete tasks and build a passport" Icon={UserRound} />
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
      <button disabled={pending} className={submit}>
        {pending ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Creating...</> : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-300">
        Already have an account? <Link href="/login" className="font-semibold text-violet-200 underline">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className={panel}>
      <div>
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-300">Log in to your TrustLoop account.</p>
      </div>
      <input name="email" type="email" required autoComplete="email" aria-label="Email" placeholder="Email" className={input} />
      <PasswordField placeholder="Password" autoComplete="current-password" />
      {error && <p role="alert" className="rounded-xl bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
      <button disabled={pending} className={submit}>
        {pending ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Logging in...</> : "Log in"}
      </button>
      <p className="text-center text-sm text-slate-300">
        New here? <Link href="/signup" className="font-semibold text-violet-200 underline">Create an account</Link>
      </p>
    </form>
  );
}