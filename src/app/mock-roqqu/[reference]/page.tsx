import { notFound, redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { simulatePayment } from "@/app/actions/mock";
import { card } from "@/lib/ui";

export const instant = false;

export default async function MockPay({ params }: { params: Promise<{ reference: string }> }) {
  if (process.env.PAYMENTS_MODE === "live") notFound();
  const { reference } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const payment = await db.payment.findUnique({ where: { reference }, include: { task: true } });
  if (!payment || payment.task.orgId !== userId) notFound();

  return (
    <Shell>
      <div className={`${card} mx-auto max-w-md space-y-4 p-8`}>
        <p className="flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-sm font-semibold text-amber-200">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden /> Sandbox simulator. This is not the real Roqqu.
        </p>
        <h1 className="text-xl font-bold">Pay for &ldquo;{payment.task.title}&rdquo;</h1>
        <p className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-4xl font-extrabold text-transparent">
          ₦{payment.task.rewardNgn.toLocaleString("en-NG")}
        </p>
        <p className="text-xs text-slate-400">Reference: {payment.reference}</p>
        <form action={simulatePayment.bind(null, payment.reference)}>
          <button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-900/40">
            Simulate payment confirmed
          </button>
        </form>
      </div>
    </Shell>
  );
}