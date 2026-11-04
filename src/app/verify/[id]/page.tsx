import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Check, ShieldCheck, ShieldX, X } from "lucide-react";
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { checkCredential, publicKeyHex } from "@/lib/credentials";
import { card } from "@/lib/ui";

export const instant = false;

type Payload = {
  title: string; criteria: string[];
  issuer: { id: string; name: string }; contributor: { id: string; name: string };
  issuedAt: string; payoutRef: string; txHash: string | null;
};

function Row({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"}`}>
        {ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
      </span>
      <span><b>{label}:</b> {value}</span>
    </li>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cred = await db.credential.findUnique({ where: { id } });
  if (!cred) notFound();

  const p = cred.payload as unknown as Payload;
  const { unchanged, signatureValid } = checkCredential(cred.payload, cred.hash, cred.signature);
  const valid = unchanged && signatureValid;
  const simulated = !p.txHash || p.txHash.startsWith("mock_");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/verify/${cred.id}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 176, color: { dark: "#312E81", light: "#FFFFFF" } });

  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className={`rounded-3xl p-6 shadow-xl ${valid ? "bg-forest text-white" : "bg-rose-800 text-white"}`}>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              {valid ? <ShieldCheck className="h-8 w-8" aria-hidden /> : <ShieldX className="h-8 w-8" aria-hidden />}
            </span>
            <div>
              <p className="text-xs font-bold tracking-widest text-white/80">TRUSTLOOP CREDENTIAL</p>
              <h1 className="text-2xl font-extrabold">{valid ? "Credential verified" : "Verification failed"}</h1>
              <p className="text-sm text-white/90">
                {valid ? "The record is unchanged and the signature is valid." : "This record was altered or the signature does not match."}
              </p>
            </div>
          </div>
        </div>

        <div className={`${card} space-y-3 p-6`}>
          <h2 className="text-2xl font-extrabold">{p.title}</h2>
          <p className="text-ink/80">Completed by <Link href={`/p/${p.contributor.id}`} className="font-bold text-forest underline">{p.contributor.name}</Link></p>
          <p className="text-ink/80">Approved and paid by <Link href={`/p/${p.issuer.id}`} className="font-bold text-forest underline">{p.issuer.name}</Link></p>
          <p className="text-sm text-muted">Issued {new Date(p.issuedAt).toLocaleDateString("en-NG")}</p>
          <ul className="space-y-2">
            {p.criteria.map((c) => (
              <li key={c} className="flex items-start gap-3 rounded-2xl bg-cream/60 px-4 py-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />{c}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${card} flex flex-col items-center gap-2 p-6`}>
          <div role="img" aria-label="QR code linking to this credential" className="rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="font-semibold">Scan to verify this credential</p>
          <p className="break-all text-center text-xs text-muted">{url}</p>
        </div>

        <div className={`${card} space-y-3 p-6`}>
          <h2 className="text-lg font-bold">Verification details</h2>
          <ul className="space-y-2">
            <Row ok label="Approved by issuer" value="Yes" />
            <Row ok label="Payment" value={simulated ? "Released to the contributor (sandbox, not real money)" : "Confirmed on-chain"} />
            <Row ok={signatureValid} label="Signature" value={signatureValid ? "Valid (Ed25519)" : "Invalid"} />
            <Row ok={unchanged} label="Record unchanged" value={unchanged ? "Yes" : "No"} />
            <Row ok={Boolean(cred.anchorTx)} label="On-chain anchor" value={cred.anchorTx ?? "Not anchored yet (planned: Base)"} />
          </ul>
          <p className="break-all text-xs text-muted">Hash: {cred.hash}</p>
          <p className="break-all text-xs text-muted">Issuer public key: {publicKeyHex()}</p>
        </div>
      </div>
    </Shell>
  );
}