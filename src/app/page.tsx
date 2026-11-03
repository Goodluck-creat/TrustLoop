import Link from "next/link";
import PassportScene from "@/components/PassportScene";
import { getUserId } from "@/lib/session";

const steps = [
  { n: "1", t: "Fund", d: "A hirer posts a task and funds the reward.", c: "from-violet-400 to-indigo-500" },
  { n: "2", t: "Deliver", d: "A freelancer submits their finished work.", c: "from-sky-400 to-cyan-500" },
  { n: "3", t: "Get paid", d: "Approval triggers the payout.", c: "from-emerald-400 to-teal-500" },
  { n: "4", t: "Prove it", d: "A verifiable credential joins their Trust Passport.", c: "from-pink-400 to-fuchsia-500" },
];

export default async function Home() {
  const signedIn = Boolean(await getUserId());

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B2B] text-white">
      <div className="tl-aurora -left-32 top-0 h-96 w-96 bg-violet-600" />
      <div className="tl-aurora right-[-6rem] top-1/3 h-[28rem] w-[28rem] bg-fuchsia-500 [animation-delay:-6s]" />
      <div className="tl-aurora bottom-0 left-1/4 h-96 w-96 bg-cyan-500 [animation-delay:-11s]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-extrabold tracking-tight">Trust<span className="text-pink-300">Loop</span></span>
        <nav className="hidden gap-8 text-sm font-semibold text-slate-300 md:flex">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#who" className="hover:text-white">For hirers & freelancers</a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/dashboard" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-indigo-900">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Log in</Link>
              <Link href="/signup" className="rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/40">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2 lg:pt-14">
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
        </div>
        <PassportScene />
      </main>

      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white ${s.c}`}>{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-slate-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="who" className="relative mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-2">
        {[
          { t: "For hirers", c: "from-indigo-500/30", l: ["Post a task and fund it in minutes", "Review work with an AI checklist", "Pay only for approved work", "Build a record of who you have worked with"] },
          { t: "For freelancers", c: "from-pink-500/30", l: ["Find paid tasks that match your skills", "Know the reward is funded before you start", "Get paid to your wallet on approval", "Own a Trust Passport anyone can verify"] },
        ].map((b) => (
          <div key={b.t} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${b.c} to-white/5 p-8 backdrop-blur`}>
            <h3 className="text-2xl font-bold">{b.t}</h3>
            <ul className="mt-4 space-y-3 text-slate-200">
              {b.l.map((x) => (<li key={x} className="flex gap-3"><span className="text-emerald-300">✓</span>{x}</li>))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="relative border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
        TrustLoop is a hackathon project built on the Roqqu API. Contact: [your email here]
      </footer>
    </div>
  );
}