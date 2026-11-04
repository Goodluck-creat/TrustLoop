import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { simulatePayment } from "@/app/actions/mock";

export default function MockRoqquPage({ params }: { params: Promise<{ reference: string }> }) {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted">Loading...</div>}>
      <Inner params={params} />
    </Suspense>
  );
}

async function Inner({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const dep = await db.deposit.findUnique({ where: { reference } });
  if (!dep || dep.userId !== userId) redirect("/wallet");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm shadow-ink/5">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Sandbox simulator</span>
        <h1 className="mt-4 text-2xl font-extrabold">Pay with Roqqu</h1>
        <p className="mt-2 text-sm text-muted">
          This stands in for Roqqu&apos;s payment page. No real money moves. In live mode you are sent to Roqqu to pay in crypto.
        </p>
        <p className="mt-5 text-3xl font-extrabold">₦{dep.amountNgn.toLocaleString("en-NG")}</p>
        <p className="mt-1 font-mono text-xs text-muted">Reference {dep.reference}</p>

        {dep.status === "CONFIRMED" ? (
          <Link href="/wallet" className="mt-6 block rounded-xl bg-forest px-5 py-3 text-center text-sm font-bold text-white">
            Already paid. Back to wallet
          </Link>
        ) : (
          <form action={simulatePayment.bind(null, dep.reference)} className="mt-6 space-y-3">
            <button className="w-full rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-[#0d2d25]">
              Simulate payment
            </button>
            <Link href="/wallet" className="block text-center text-sm font-semibold text-muted hover:text-ink">Cancel</Link>
          </form>
        )}
      </div>
    </main>
  );
}
