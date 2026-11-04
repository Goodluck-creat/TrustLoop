import { notFound } from "next/navigation";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { submitAttestation } from "@/app/actions/external";
import { card, input } from "@/lib/ui";

export const instant = false;
export const metadata = { robots: { index: false, follow: false } };

const errors: Record<string, string> = {
  name: "Please enter your full name.",
  email: "Please enter a valid email address.",
  self: "You cannot confirm your own work. Ask someone else.",
};

export default async function AttestPage({
  params,
  searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string; done?: string }> }) {
  const { token } = await params;
  const { e, done } = await searchParams;
  const w = await db.externalWork.findUnique({ where: { refereeToken: token }, include: { user: true } });
  if (!w) notFound();
  let host = "";
  try { host = new URL(w.evidenceUrl).hostname; } catch {}

  return (
    <Shell>
      <div className="mx-auto max-w-xl space-y-5">
        <div className={`${card} space-y-3 p-6`}>
          <p className="text-sm font-semibold text-muted">Referee request</p>
          <h1 className="text-2xl font-extrabold">{w.user.name} lists this work on TrustLoop</h1>
          <p className="font-bold">{w.title}</p>
          <p className="text-ink/80">{w.description}</p>
          {w.clientName && <p className="text-sm text-muted">Client or employer: {w.clientName}</p>}
          <a href={w.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-forest underline">
            {host || w.evidenceUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </a>
        </div>

        {w.respondedAt || done ? (
          <div className={`${card} flex items-start gap-3 p-6`}>
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
            <p>Thank you. Your response was recorded{w.refereeName ? ` as ${w.refereeName}` : ""} and added to {w.user.name}&apos;s Trust Passport.</p>
          </div>
        ) : (
          <form action={submitAttestation.bind(null, token)} className={`${card} space-y-4 p-6`}>
            <h2 className="text-lg font-bold">Can you vouch for this work?</h2>
            <p className="text-sm text-muted">Only confirm if you know first-hand that {w.user.name} did this work. Your name and email domain will be shown next to your answer.</p>
            {e && errors[e] && <p role="alert" className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">{errors[e]}</p>}
            <input name="name" placeholder="Your full name" required className={input} />
            <input name="email" type="email" placeholder="Your work or personal email" required className={input} />
            <textarea name="comment" rows={3} maxLength={500} placeholder="Anything to add (optional)" className={input} />
            <fieldset className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="response" value="CONFIRMED" defaultChecked /> Yes, I confirm this work</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="response" value="DISPUTED" /> No, this is not accurate</label>
            </fieldset>
            <button className="w-full rounded-xl bg-forest px-5 py-3 font-bold text-white hover:bg-[#0d2d25]">Submit</button>
          </form>
        )}
      </div>
    </Shell>
  );
}
