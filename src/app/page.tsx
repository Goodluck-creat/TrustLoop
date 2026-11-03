export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-sm font-semibold text-indigo-700">TrustLoop</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
          Get paid for work. Prove it forever.
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Communities fund tasks. You deliver. Every approved task becomes a
          credential anyone can verify.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#"
            className="rounded-xl bg-indigo-700 px-6 py-3 text-center font-semibold text-white"
          >
            Get started
          </a>
          <a
            href="#"
            className="rounded-xl border border-indigo-700 px-6 py-3 text-center font-semibold text-indigo-700"
          >
            Verify a credential
          </a>
        </div>
        <p className="mt-12 text-sm text-slate-500">Payments powered by Roqqu</p>
      </section>
    </main>
  );
}