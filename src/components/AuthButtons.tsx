import Link from "next/link";
import { getUserId } from "@/lib/session";

export async function HeaderAuth() {
  const signedIn = Boolean(await getUserId());
  return signedIn ? (
    <Link href="/dashboard" className="rounded-full bg-forest px-5 py-2 text-sm font-bold text-white">Dashboard</Link>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-cream">Log in</Link>
      <Link href="/signup" className="rounded-full bg-forest text-white hover:bg-[#0d2d25] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-forest/20">Sign up</Link>
    </div>
  );
}

export async function HeroAuth() {
  const signedIn = Boolean(await getUserId());
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href={signedIn ? "/dashboard" : "/signup"} className="rounded-2xl bg-forest text-white hover:bg-[#0d2d25] px-7 py-3.5 text-center font-bold text-white shadow-xl shadow-forest/25 transition hover:-translate-y-0.5">
        {signedIn ? "Open dashboard" : "Get started free"}
      </Link>
      {!signedIn && (
        <Link href="/login" className="rounded-2xl border border-ink/20 bg-cream/60 px-7 py-3.5 text-center font-semibold text-ink backdrop-blur transition hover:-translate-y-0.5 hover:bg-cream">
          Log in
        </Link>
      )}
    </div>
  );
}