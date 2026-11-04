import Link from "next/link";
import PassportScene from "@/components/PassportScene";
import { Suspense } from "react";
import { HeaderAuth, HeroAuth } from "@/components/AuthButtons";

const steps = [
  { n: "1", t: "Fund", d: "A hirer posts a task and funds the reward.", c: "from-forest to-[#2c6b57] text-white" },
  { n: "2", t: "Deliver", d: "A freelancer submits their finished work.", c: "from-[#2c6b57] to-[#4a8a74] text-white" },
  { n: "3", t: "Get paid", d: "Approval triggers the payout.", c: "from-[#6f8a73] to-[#3f6652] text-white" },
  { n: "4", t: "Prove it", d: "A verifiable credential joins their Trust Passport.", c: "from-bronze to-[#8a6638] text-white" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="tl-aurora -left-32 top-0 h-96 w-96 bg-sage" />
      <div className="tl-aurora right-[-6rem] top-1/3 h-[28rem] w-[28rem] bg-sand [animation-delay:-6s]" />
      <div className="tl-aurora bottom-0 left-1/4 h-96 w-96 bg-[#cfe0d3] [animation-delay:-11s]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-extrabold tracking-tight">Trust<span className="text-bronze">Loop</span></span>
        <nav className="hidden gap-8 text-sm font-semibold text-muted md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#who" className="hover:text-ink">For hirers & freelancers</a>
        </nav>
       <Suspense fallback={<div className="h-10 w-40" />}>
  <HeaderAuth />
</Suspense>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2 lg:pt-14">
        <div>
          <p className="inline-block rounded-full border border-ink/15 bg-cream px-4 py-1 text-sm font-semibold text-forest backdrop-blur">
            Built for the Anambra Web3 Hackathon
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            Get paid for work.{" "}
            <span className="bg-gradient-to-r from-forest via-[#2c6b57] to-bronze bg-clip-text text-transparent">Prove it forever.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Communities fund tasks. Freelancers deliver. Every approved task becomes a credential anyone can verify.
          </p>
         <Suspense fallback={<div className="mt-8 h-14" />}>
  <HeroAuth />
</Suspense>
        </div>
        <PassportScene />
      </main>

      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:bg-cream">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white ${s.c}`}>{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="who" className="relative mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-2">
        {[
          { t: "For hirers", c: "from-sage/40", l: ["Post a task and fund it in minutes", "Review work with an AI checklist", "Pay only for approved work", "Build a record of who you have worked with"] },
          { t: "For freelancers", c: "from-sand/60", l: ["Find paid tasks that match your skills", "Know the reward is funded before you start", "Get paid to your wallet on approval", "Own a Trust Passport anyone can verify"] },
        ].map((b) => (
          <div key={b.t} className={`rounded-3xl border border-ink/10 bg-gradient-to-br ${b.c} to-white p-8 backdrop-blur`}>
            <h3 className="text-2xl font-bold">{b.t}</h3>
            <ul className="mt-4 space-y-3 text-ink/80">
              {b.l.map((x) => (<li key={x} className="flex gap-3"><span className="text-emerald-700">✓</span>{x}</li>))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="relative border-t border-ink/10 px-6 py-8 text-center text-sm text-muted">
        TrustLoop is a hackathon project built on the Roqqu API. Contact: [your email here]
      </footer>
    </div>
  );
}