import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BadgeCheck, Bot, Check, Coins, QrCode, Users } from "lucide-react";
import PassportScene from "@/components/PassportScene";
import Avatar from "@/components/Avatar";
import { HeaderAuth, HeroAuth } from "@/components/AuthButtons";

const steps = [
  { n: "1", t: "Fund", d: "A hirer posts a task and funds the reward.", c: "from-violet-400 to-indigo-500" },
  { n: "2", t: "Deliver", d: "A freelancer submits their finished work.", c: "from-sky-400 to-cyan-500" },
  { n: "3", t: "Get paid", d: "Approval releases the reward instantly.", c: "from-emerald-400 to-teal-500" },
  { n: "4", t: "Prove it", d: "A signed credential joins their Trust Passport.", c: "from-pink-400 to-fuchsia-500" },
];

const features = [
  { Icon: QrCode, t: "Verifiable credentials", d: "Every approved task becomes a signed record anyone can check with a QR code.", tag: "Live", cls: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30" },
  { Icon: Bot, t: "AI task clarity", d: "Flags vague acceptance criteria before a task goes live, so reviews stay fair.", tag: "Preview", cls: "bg-amber-400/15 text-amber-200 ring-amber-300/30" },
  { Icon: Users, t: "Social Trust Passports", d: "Follow professionals and share a passport built from real, approved work.", tag: "Live", cls: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30" },
  { Icon: Coins, t: "Stablecoin payouts", d: "Withdraw earnings as USDC or USDT to your own wallet through Roqqu.", tag: "Sandbox", cls: "bg-amber-400/15 text-amber-200 ring-amber-300/30" },
];

const samples = [
  { org: "Campus Tech Club", title: "Design a logo for our community", pay: "₦20,000", tag: "Design" },
  { org: "Lagos Retail Shop", title: "Test our website on mobile", pay: "₦8,000", tag: "Testing" },
  { org: "Open Source Group", title: "Translate onboarding docs", pay: "₦12,000", tag: "Writing" },
];

const hirers = ["Post a task and fund it in minutes", "Check vague criteria with the AI clarity check", "Pay only for work you approve", "Build a record of who you have worked with"];
const freelancers = ["Find paid tasks that match your skills", "Know the reward is funded before you start", "Get paid to your balance on approval", "Own a Trust Passport anyone can verify"];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B2B] text-white">
      <div className="tl-aurora -left-32 top-0 h-96 w-96 bg-violet-600" />
      <div className="tl-aurora right-[-6rem] top-1/3 h-[28rem] w-[28rem] bg-fuchsia-500 [animation-delay:-6s]" />
      <div className="tl-aurora bottom-0 left-1/4 h-96 w-96 bg-cyan-500 [animation-delay:-11s]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-xl font-extrabold tracking-tight">Trust<span className="text-pink-300">Loop</span></span>
        <nav className="hidden gap-8 text-sm font-semibold text-slate-300 md:flex" aria-label="Sections">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#who" className="hover:text-white">Who it is for</a>
        </nav>
        <Suspense fallback={<div className="h-10 w-40" />}>
          <HeaderAuth />
        </Suspense>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:pt-14">
        <div>
          <p className="inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold text-cyan-200 backdrop-blur">
            Built for the Anambra Web3 Hackathon
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            Get paid for work.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">Prove it forever.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            Communities fund tasks. Freelancers deliver. Every approved task becomes a credential anyone can verify.
          </p>
          <Suspense fallback={<div className="mt-8 h-14" />}>
            <HeroAuth />
          </Suspense>
        </div>
        <PassportScene />
      </main>

      <section id="how" className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold ${s.c}`}>{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-slate-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold">What is inside</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-300">Web3, AI, social and stablecoin features, each labelled with what works today.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map(({ Icon, t, d, tag, cls }) => (
            <div key={t} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{t}</h3>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>{tag}</span>
                </div>
                <p className="mt-1 text-slate-300">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold">Tasks look like this</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-300">Example tasks to show the format. Real tasks appear once organizations post them.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {samples.map((s) => (
            <article key={s.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10">
              <div className="flex items-center gap-3">
                <Avatar name={s.org} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-300">{s.org}</p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">Example</span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-1 text-sm font-bold">{s.pay}</span>
                <span className="text-sm text-slate-300">{s.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="who" className="relative mx-auto grid max-w-6xl gap-5 px-4 pb-20 sm:px-6 md:grid-cols-2">
        {[
          { t: "For hirers", c: "from-indigo-500/30", l: hirers },
          { t: "For freelancers", c: "from-pink-500/30", l: freelancers },
        ].map((b) => (
          <div key={b.t} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${b.c} to-white/5 p-8 backdrop-blur`}>
            <h3 className="text-2xl font-bold">{b.t}</h3>
            <ul className="mt-4 space-y-3 text-slate-200">
              {b.l.map((x) => (
                <li key={x} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-24 text-center sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-10 shadow-2xl shadow-violet-900/40">
          <BadgeCheck className="mx-auto h-10 w-10" aria-hidden />
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Start building your Trust Passport</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/90">Create a free account and make your next project count.</p>
          <div className="flex justify-center">
            <Suspense fallback={<div className="mt-8 h-14" />}>
              <HeroAuth />
            </Suspense>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/80">Sandbox payments while Roqqu access is pending <ArrowRight className="h-4 w-4" aria-hidden /></p>
        </div>
      </section>

      <footer className="relative border-t border-white/10 px-4 py-8 text-center text-sm text-slate-400">
        TrustLoop is a hackathon project built on the Roqqu API. Contact: [your email here]
      </footer>
    </div>
  );
}