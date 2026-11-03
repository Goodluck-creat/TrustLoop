const steps = [
  { n: "1", t: "Fund", d: "An organization posts a task and funds the reward.", c: "bg-violet-100" },
  { n: "2", t: "Deliver", d: "A contributor submits their finished work.", c: "bg-sky-100" },
  { n: "3", t: "Get paid", d: "Approval triggers payment through Roqqu.", c: "bg-emerald-100" },
  { n: "4", t: "Prove it", d: "A verifiable credential is issued instantly.", c: "bg-pink-100" },
];

const qr = Array.from({ length: 49 }, (_, i) => (i * 13) % 5 < 2);

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 text-slate-800">
      {/* soft animated background */}
      <div className="blob -left-24 top-0 h-80 w-80 bg-violet-300" />
      <div className="blob right-0 top-40 h-96 w-96 bg-pink-200 [animation-delay:-5s]" />
      <div className="blob bottom-0 left-1/3 h-80 w-80 bg-sky-200 [animation-delay:-9s]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold tracking-tight text-indigo-700">TrustLoop</span>
        <a href="#how" className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
          How it works
        </a>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:pt-20">
        <div className="rise">
          <p className="inline-block rounded-full bg-white/70 px-4 py-1 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
            Built on Roqqu
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Get paid for work.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
              Prove it forever.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-600">
            Communities fund tasks. You deliver. Every approved task becomes a
            credential anyone can verify.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#how" className="rounded-2xl bg-indigo-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">
              Get started
            </a>
            <a href="#" className="rounded-2xl bg-white/80 px-7 py-3.5 text-center font-semibold text-indigo-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5">
              Verify a credential
            </a>
          </div>
        </div>

        {/* floating credential card */}
        <div className="relative mx-auto h-[420px] w-full max-w-sm">
          <div className="float absolute left-4 top-6 w-72 rotate-[-4deg] rounded-3xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-indigo-100 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">CREDENTIAL</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Verified</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold">Logo design</h3>
            <p className="text-sm text-slate-500">Approved by Anambra Techies</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid grid-cols-7 gap-[3px]">
                {qr.map((on, i) => (
                  <span key={i} className={`h-3 w-3 rounded-[3px] ${on ? "bg-indigo-700" : "bg-indigo-100"}`} />
                ))}
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">Paid</p>
                <p className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">On-chain</p>
              </div>
            </div>
          </div>
          <div className="float-slow absolute right-0 top-0 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-3xl font-bold text-amber-900 shadow-lg">
            ₦
          </div>
          <div className="float-slow absolute bottom-6 right-4 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur [animation-delay:-3s]">
            ✓ Payment confirmed
          </div>
          <div className="float absolute bottom-0 left-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-300 to-violet-400 opacity-80 [animation-delay:-2s]" />
        </div>
      </main>

      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold text-indigo-800 ${s.c}`}>{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative pb-10 text-center text-sm text-slate-500">
        TrustLoop · Payments powered by Roqqu
      </footer>
    </div>
  );
}