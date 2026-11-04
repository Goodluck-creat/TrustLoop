import Link from "next/link";
import { getUserId } from "@/lib/session";

export async function HeaderAuth({ onDark = false }: { onDark?: boolean }) {
  const signedIn = Boolean(await getUserId());
  const solid = onDark ? "bg-white text-forest hover:bg-sand" : "bg-forest text-white hover:bg-[#0d2d25]";
  const ghost = onDark
    ? "border border-white/40 text-white hover:bg-white/10"
    : "border border-ink/20 text-ink hover:bg-cream";
  return signedIn ? (
    <Link href="/dashboard" className={`rounded-full px-4 py-2 text-sm font-bold ${solid}`}>Dashboard</Link>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-semibold ${ghost}`}>Log in</Link>
      <Link href="/signup" className={`rounded-full px-4 py-2 text-sm font-bold ${solid}`}>Sign up</Link>
    </div>
  );
}

export async function HeroAuth({ onDark = false }: { onDark?: boolean }) {
  const signedIn = Boolean(await getUserId());
  const solid = onDark ? "bg-white text-forest hover:bg-sand" : "bg-forest text-white hover:bg-[#0d2d25]";
  const ghost = onDark
    ? "border border-white/40 text-white hover:bg-white/10"
    : "border border-ink/20 text-ink hover:bg-cream";
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Link href={signedIn ? "/dashboard" : "/signup"} className={`rounded-xl px-6 py-3 text-center text-sm font-bold shadow-lg transition hover:-translate-y-0.5 ${solid}`}>
        {signedIn ? "Open dashboard" : "Get started free"}
      </Link>
      {!signedIn && (
        <Link href="/login" className={`rounded-xl px-6 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 ${ghost}`}>
          Log in
        </Link>
      )}
    </div>
  );
}