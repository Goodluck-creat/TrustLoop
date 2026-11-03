import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { checkCredential, publicKeyHex } from "@/lib/credentials";

export const instant = false;

type Payload = {
  title: string; criteria: string[]; rewardNgn: number;
  issuer: { id: string; name: string }; contributor: { id: string; name: string };
  issuedAt: string; payoutRef: string; txHash: string | null;
};

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cred = await db.credential.findUnique({ where: { id } });
  if (!cred) notFound();

  const p = cred.payload as unknown as Payload;
  const { unchanged, signatureValid } = checkCredential(cred.payload, cred.hash, cred.signature);
  const valid = unchanged && signatureValid;
  const simulated = p.txHash?.startsWith("mock_") ?? false;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/verify/${cred.id}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 176, color: { dark: "#312E81", light: "#FFFFFF" } });

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10 text-slate-800">
      <div className="mx-auto max-w-xl space-y-4">
        <div className={`rounded-3xl p-6 text-white shadow-xl ${valid ? "bg-gradient-to-br from-indigo-600 to-violet-600" : "bg-red-700"}`}>
          <p className="text-xs font-bold tracking-widest opacity-80">TRUSTLOOP CREDENTIAL</p>
          <h1 className="mt-2 text-2xl font-bold">{valid ? "✓ Credential verified" : "✗ Verification failed"}</h1>
          <p className="mt-1 text-sm opacity-90">
            {valid ? "The record is unchanged and the signature is valid." : "This record was altered or the signature does not match."}
          </p>
        </div>

        <div className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
          <h2 className="text-xl font-bold">{p.title}</h2>
          <p>Completed by <Link href={`/p/${p.contributor.id}`} className="font-bold text-indigo-700 underline">{p.contributor.name}</Link></p>
          <p>Approved and paid by <Link href={`/p/${p.issuer.id}`} className="font-bold text-indigo-700 underline">{p.issuer.name}</Link></p>
          
          <p className="text-sm text-slate-500">Issued {new Date(p.issuedAt).toLocaleDateString("en-NG")}</p>
          <ul className="list-disc space-y-1 pl-5">
            {p.criteria.map((c) => (<li key={c}>{c}</li>))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
          <div role="img" aria-label="QR code linking to this credential" className="rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="text-sm font-semibold">Scan to verify this credential</p>
          <p className="break-all text-center text-xs text-slate-500">{url}</p>
        </div>

        <div className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-6 text-sm backdrop-blur">
          <p><b>Approved by issuer:</b> Yes</p>
          <p><b>Payment:</b> {p.txHash && !simulated ? "Confirmed on-chain" : "Released to the contributor (sandbox, not real money)"}</p>
          <p><b>Signature:</b> {signatureValid ? "Valid (Ed25519)" : "Invalid"}</p>
          <p><b>Record unchanged:</b> {unchanged ? "Yes" : "No"}</p>
          <p><b>On-chain anchor:</b> {cred.anchorTx ?? "Not anchored yet (planned: Base)"}</p>
          <p className="break-all text-xs text-slate-500">Hash: {cred.hash}</p>
          <p className="break-all text-xs text-slate-500">Issuer public key: {publicKeyHex()}</p>
        </div>
      </div>
    </main>
  );
}