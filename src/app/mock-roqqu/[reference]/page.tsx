import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { simulatePayment } from "@/app/actions/mock";

export const instant = false;

export default async function MockPay({ params }: { params: Promise<{ reference: string }> }) {
  if (process.env.PAYMENTS_MODE === "live") notFound();
  const { reference } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const payment = await db.payment.findUnique({ where: { reference }, include: { task: true } });
  if (!payment || payment.task.orgId !== userId) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6">
      <div className="w-full max-w-sm space-y-4 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
          Sandbox simulator. This is not the real Roqqu.
        </p>
        <h1 className="text-xl font-bold text-slate-800">Pay for “{payment.task.title}”</h1>
        <p className="text-3xl font-extrabold text-indigo-700">₦{payment.task.rewardNgn.toLocaleString("en-NG")}</p>
        <p className="text-xs text-slate-500">Reference: {payment.reference}</p>
        <form action={simulatePayment.bind(null, payment.reference)}>
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">Simulate payment confirmed</button>
        </form>
      </div>
    </main>
  );
}