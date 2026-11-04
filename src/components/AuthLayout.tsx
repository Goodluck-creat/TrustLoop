import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, Wallet, Users } from "lucide-react";

const points = [
  { Icon: BadgeCheck, t: "Verified work", d: "Every approved task becomes a signed credential." },
  { Icon: Wallet, t: "Paid on approval", d: "Rewards reach your balance the moment work is approved." },
  { Icon: Users, t: "A passport that follows you", d: "Share your record with future clients and employers." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B2B] text-white">
      <div className="tl-aurora pointer-events-none -left-32 top-0 h-96 w-96 bg-violet-600" />
      <div className="tl-aurora pointer-events-none right-[-6rem] top-1/3 h-[26rem] w-[26rem] bg-fuchsia-500 [animation-delay:-6s]" />
      <div className="tl-aurora pointer-events-none bottom-0 left-1/4 h-96 w-96 bg-cyan-500 [animation-delay:-11s]" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <div className="hidden lg:block">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            Trust<span className="text-pink-300">Loop</span>
          </Link>
          <h1 className="mt-8 text-5xl font-extrabold leading-tight">
            Get paid for work.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">Prove it forever.</span>
          </h1>
          <ul className="mt-10 space-y-5">
            {points.map(({ Icon, t, d }) => (
              <li key={t} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="text-slate-300">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-6 block text-center text-2xl font-extrabold tracking-tight lg:hidden">
            Trust<span className="text-pink-300">Loop</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}