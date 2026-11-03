import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { checkCredential, publicKeyHex } from "@/lib/credentials";

export const instant = false;

type Payload = {
  title: string; criteria: string[]; rewardNgn: number;
  issuer: { name: string }; contributor: { name: string };
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <div className="mx-auto max-w-xl space-y-4">
        <div className={`rounded-3xl p-6 text-white shadow-xl ${valid ? "bg-gradient-to-br from-indigo-600 to-violet-600" : "bg-red-700"}`}>
          <p className="text-xs font-bold tracking-widest opacity-80">TRUSTLOOP CREDENTIAL</p>
          <h1 className="mt-2 text-2xl font-bold">{valid ? "✓ Credential verified" : "✗ Verification failed"}</h1>
          <p className="mt-1 text-sm opacity-90">
            {valid ? "The record is unchanged and the signature is valid." : "This record was altered or the signature does not match."}
          </p>
        </div>

        <div className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-slate-800">{p.title}</h2>
          <p className="text-slate-700">Completed by <b>{p.contributor.name}</b></p>
          <p className="text-slate-700">Approved and paid by <b>{p.issuer.name}</b></p>
          <p className="text-slate-700">Reward: <b>₦{p.rewardNgn.toLocaleString("en-NG")}</b></p>
          <p className="text-sm text-slate-500">Issued {new Date(p.issuedAt).toLocaleDateString("en-NG")}</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {p.criteria.map((c) => (<li key={c}>{c}</li>))}
          </ul>
        </div>

        <div className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-6 text-sm backdrop-blur">
          <p><b>Approved by issuer:</b> Yes</p>
          <p>
            <b>Payment:</b> {simulated ? "Confirmed in the sandbox (simulated, not real money)" : "Confirmed"}
          </p>
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