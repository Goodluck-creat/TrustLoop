import { createHash, createPrivateKey, createPublicKey, sign, verify } from "crypto";
import type { Prisma } from "@prisma/client";

// Stable JSON with sorted keys, so the same data always hashes the same.
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}

function keys() {
  const seed = process.env.CREDENTIAL_SEED;
  if (!seed || seed.length !== 64) throw new Error("CREDENTIAL_SEED is missing or invalid");
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed, "hex")]);
  const priv = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  return { priv, pub: createPublicKey(priv) };
}

export const hashPayload = (payload: unknown) =>
  createHash("sha256").update(canonical(payload)).digest("hex");

export const signHash = (hash: string) =>
  sign(null, Buffer.from(hash, "hex"), keys().priv).toString("base64");

export function publicKeyHex() {
  return (keys().pub.export({ format: "der", type: "spki" }) as Buffer).subarray(-32).toString("hex");
}

export function checkCredential(payload: unknown, hash: string, signature: string) {
  const unchanged = hashPayload(payload) === hash;
  let signatureValid = false;
  try {
    signatureValid = verify(null, Buffer.from(hash, "hex"), keys().pub, Buffer.from(signature, "base64"));
  } catch {}
  return { unchanged, signatureValid };
}

export async function issueCredential(
  tx: Prisma.TransactionClient,
  taskId: string,
  payoutRef: string,
  txHash: string | null,
) {
  const task = await tx.task.findUnique({ where: { id: taskId }, include: { org: true, contributor: true } });
  if (!task || !task.contributor) throw new Error("Task not ready for a credential");
  const payload = {
    version: 1,
    taskId: task.id,
    title: task.title,
    criteria: task.criteria,
    rewardNgn: task.rewardNgn,
    issuer: { id: task.org.id, name: task.org.name },
    contributor: { id: task.contributor.id, name: task.contributor.name },
    issuedAt: new Date().toISOString(),
    payoutRef,
    txHash,
  };
  const hash = hashPayload(payload);
  await tx.credential.create({
    data: {
      taskId: task.id,
      contributorId: task.contributor.id,
      issuerId: task.org.id,
      payload: payload as Prisma.InputJsonValue,
      hash,
      signature: signHash(hash),
    },
  });
}