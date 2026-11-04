import { Suspense } from "react";
import { Check } from "lucide-react";
import PassportScene from "@/components/PassportScene";
import { HeaderAuth, HeroAuth } from "@/components/AuthButtons";

const steps = [
  { n: "1", t: "Fund", d: "A hirer posts a task and funds the reward." },
  { n: "2", t: "Deliver", d: "A freelancer submits their finished work." },
  { n: "3", t: "Get paid", d: "Approval triggers the payout." },
  { n: "4", t: "Prove it", d: "A verifiable credential joins their Trust Passport." },
];

const groups = [
  { t: "For hirers", l: ["Post a task and fund it in minutes", "Review work with an AI checklist", "Pay only for approved work", "Keep a record of who you have worked with"] },
  { t: "For freelancers", l: ["Find paid tasks that match your skills", "Know the reward is funded before you start", "Get paid on approval", "Own a Trust Passport anyone can verify"] },
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
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-extrabold tracking-tight">Trust<span className="text-bronze">Loop</span></span>
          <nav className="hidden gap-6 text-sm font-semibold text-white/80 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#who" className="hover:text-white">For hirers and freelancers</a>
          </nav>
          <Suspense fallback={<div className="h-9 w-36" />}>
            <HeaderAuth onDark />
          </Suspense>
        </header>

        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-5 pb-8 lg:grid-cols-2">
          <div>
            <p className="inline-block rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-sand">
              Built for the Anambra Web3 Hackathon
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Good Work Deserves to Be <span className="text-sand">Trusted.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/80 sm:text-lg">
              Communities fund tasks. Freelancers deliver. Every approved task becomes a credential anyone can verify.
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

      <footer className="border-t border-ink/10 px-5 py-5 text-center text-xs text-muted">
        TrustLoop is a hackathon project built on the Roqqu API. Contact: [your email here]
      </footer>
    </div>
  );
}