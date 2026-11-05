import { Suspense } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import PassportScene from "@/components/PassportScene";
import LandingNav from "@/components/LandingNav";
import { HeaderAuth, HeroAuth, MenuAuth } from "@/components/AuthButtons";

const steps = [
  { n: "1", t: "Post a job", d: "Describe the work and put the payment in. The money is held until the job is done." },
  { n: "2", t: "Pick someone", d: "Freelancers apply. You see their past work and choose the right person." },
  { n: "3", t: "Approve and pay", d: "Happy with the result? Approve it and they are paid at once." },
  { n: "4", t: "Keep the proof", d: "The freelancer gets a signed record of the job that anyone can check." },
];

const groups = [
  { t: "For hirers", l: ["Post a job and pay safely from your wallet", "See each applicant's past work before you choose", "Pay only for work you approve", "Keep a record of who you have worked with"] },
  { t: "For freelancers", l: ["Find paid jobs that match your skills", "Know the money is in before you start", "Get paid the moment your work is approved", "Build a profile of proven work anyone can verify", "Free to join. A small fee applies only when you withdraw, and we show it first"] },
];

// Put a photo at public/hero.jpg. Until then the forest gradient shows.
const heroBg =
  "linear-gradient(105deg, rgba(10,38,31,0.92) 0%, rgba(18,61,50,0.78) 55%, rgba(18,61,50,0.55) 100%), url(/hero.jpg), linear-gradient(135deg, #123D32, #17221F)";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <section
        className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: heroBg }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:pt-4">
          <LandingNav
            desktopAuth={
              <Suspense fallback={<div className="h-9 w-36" />}>
                <HeaderAuth onDark />
              </Suspense>
            }
            menuAuth={
              <Suspense fallback={<div className="h-24" />}>
                <MenuAuth />
              </Suspense>
            }
          />
        </div>

        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-5 pb-8 pt-8 sm:pt-10 lg:grid-cols-2">
          <div>
            <p className="inline-block rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-sand">
              Powered by Roqqu
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Good Work Deserves to Be <span className="text-sand">Trusted.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/80 sm:text-lg">
              Hire someone for a job and pay only when it is done. Freelancers get paid instantly and build a profile of proven work that anyone can check.
            </p>
            <Suspense fallback={<div className="mt-6 h-12" />}>
              <HeroAuth onDark />
            </Suspense>
          </div>
          <PassportScene />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div id="how" className="scroll-mt-4">
          <h2 className="text-xl font-bold sm:text-2xl">How it works</h2>
          <ol className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="border-l-2 border-bronze pl-3">
                <p className="text-xs font-bold text-bronze">Step {s.n}</p>
                <p className="text-base font-bold">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>

        <div id="who" className="mt-10 grid scroll-mt-4 gap-8 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.t}>
              <h2 className="text-xl font-bold sm:text-2xl">{g.t}</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {g.l.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-forest text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-5 gap-y-6 px-5 py-8 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-extrabold tracking-tight">Trust<span className="text-bronze">Loop</span></span>
            <p className="mt-2 max-w-xs text-sm text-white/70">
              Hire with confidence. Get paid instantly. Build a record of work that anyone can verify.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Explore</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><a href="#how" className="text-white/90 hover:text-white">How it works</a></li>
              <li><a href="#who" className="text-white/90 hover:text-white">For hirers and freelancers</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Account</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><Link href="/login" className="text-white/90 hover:text-white">Log in</Link></li>
              <li><Link href="/signup" className="text-white/90 hover:text-white">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-5 py-4 text-center text-xs text-white/60">
          Powered by Roqqu · © 2026 TrustLoop
        </div>
      </footer>
    </div>
  );
}
