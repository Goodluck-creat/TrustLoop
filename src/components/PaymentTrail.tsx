import { Link2, ShieldCheck, ExternalLink, FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { explorerUrl } from "@/lib/proof";

// Shows how a job was paid: funded, held, released. If the funding came through Roqqu,
// the transaction hash is shown with a link to the public blockchain record.
// Public pages pass showAmounts={false}, because earnings are never shown on a Trust Passport.
export default async function PaymentTrail({
  taskId,
  credentialId,
  showAmounts = false,
}: {
  taskId?: string;
  credentialId?: string;
  showAmounts?: boolean;
}) {
  let tid = taskId;
  if (!tid && credentialId) tid = (await db.credential.findUnique({ where: { id: credentialId }, select: { taskId: true } }))?.taskId;
  if (!tid) return null;
  const [task, fund] = await Promise.all([
    db.task.findUnique({ where: { id: tid }, select: { rewardNgn: true } }),
    db.payment.findFirst({ where: { taskId: tid, type: "FUND" }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!task || !fund) return null;

  const hash = fund.txHash;
  const tx = hash ? await db.roqquTx.findFirst({ where: { hash }, select: { live: true } }) : null;
  const url = explorerUrl(fund.network, hash);
  const naira = "₦" + task.rewardNgn.toLocaleString("en-NG");

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-ink/5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Link2 className="h-5 w-5 text-forest" aria-hidden /> Payment trail
      </h2>
      <ol className="mt-3 space-y-3 text-sm">
        <li className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
          <span>
            <b>Funded before work started.</b> {showAmounts ? `${naira} was locked from the hirer's wallet. ` : "The reward was locked from the hirer's wallet. "}
            The freelancer was paid the moment the work was approved.
          </span>
        </li>
        {hash ? (
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
            <span>
              <b>{tx?.live === false ? "Wallet top-up settled on Roqqu's test network." : "Wallet top-up settled through Roqqu."}</b>{" "}
              <span className="break-all font-mono text-xs">{hash.length > 22 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash}</span>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-forest underline">
                  View on the blockchain <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </span>
          </li>
        ) : (
          <li className="flex gap-3">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span className="text-muted">This job was paid in demo mode, so there is no blockchain transaction to show.</span>
          </li>
        )}
      </ol>
    </section>
  );
}
