import Link from "next/link";
import { getUserId } from "@/lib/session";

export async function HeaderAuth() {
  const signedIn = Boolean(await getUserId());
  return signedIn ? (
    <Link href="/dashboard" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-indigo-900">Dashboard</Link>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Log in</Link>
      <Link href="/signup" className="rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/40">Sign up</Link>
    </div>
  );
}

export async function HeroAuth() {
  const signedIn = Boolean(await getUserId());
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href={signedIn ? "/dashboard" : "/signup"} className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-7 py-3.5 text-center font-bold text-white shadow-xl shadow-violet-900/50 transition hover:-translate-y-0.5">
        {signedIn ? "Open dashboard" : "Get started free"}
      </Link>
      {!signedIn && (
        <Link href="/login" className="rounded-2xl border border-white/25 bg-white/5 px-7 py-3.5 text-center font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10">
          Log in
        </Link>
      )}
    </div>
  );
}