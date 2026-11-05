"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { notify } from "@/lib/notify";
import { ensureDepositAddress, NETWORKS, type DepositNetwork } from "@/lib/wallet";
import { isLiveMode, roqquRequest, asRecord } from "@/lib/payments/client";
import { refreshRoqquStatus } from "@/lib/payments/customers";

async function requireUser() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return userId;
}

// Messages for the wallet page are fixed codes, never text from a URL.
const back = (code: string): never => redirect(`/wallet?m=${code}`);

export async function createAddress(network: string) {
  const userId = await requireUser();
  if (!(NETWORKS as readonly string[]).includes(network)) return back("badnet");
  await ensureDepositAddress(userId, network as DepositNetwork);
  return back("address");
}

export async function checkMyRoqquStatus() {
  const userId = await requireUser();
  const status = await refreshRoqquStatus(userId);
  return back(status === "sandbox" ? "sandbox" : status === "unknown" ? "unreachable" : `status_${status}`);
}

// Asks Roqqu where a withdrawal is (GET /transaction/refId/:refid).
export async function checkWithdrawal(reference: string) {
  const userId = await requireUser();
  const w = await db.withdrawal.findUnique({ where: { reference } });
  if (!w || w.userId !== userId) return back("nowd");
  if (!w.refid || !isLiveMode()) return back("nosend");
  let data: Record<string, unknown>;
  try {
    data = asRecord(await roqquRequest("GET", `/transaction/refId/${encodeURIComponent(w.refid)}`));
  } catch {
    return back("unreachable");
  }
  const hash = data.tx_hash ? String(data.tx_hash) : "";
  if (!hash) return back("pending");
  if (w.status !== "COMPLETED") {
    await db.withdrawal.update({ where: { id: w.id }, data: { status: "COMPLETED", txHash: hash } });
    await notify(db, userId, "Withdrawal sent", `₦${w.amountNgn.toLocaleString("en-NG")} was sent as ${w.asset} on ${w.network}.`, "/wallet");
  }
  return back("confirmed");
}

// Asks Roqqu to refund a send that never went through (POST /transaction/refund).
// Roqqu only allows this an hour after the send, and only if it failed on-chain.
// The money comes back to the wallet when Roqqu's "token_refunded" webhook arrives.
export async function recoverWithdrawal(reference: string) {
  const userId = await requireUser();
  const w = await db.withdrawal.findUnique({ where: { reference } });
  if (!w || w.userId !== userId || !w.refid || !isLiveMode()) return back("nosend");
  if (w.status !== "PROCESSING" || w.txHash) return back("notstuck");
  if (Date.now() - w.createdAt.getTime() < 60 * 60 * 1000) return back("toosoon");
  try {
    await roqquRequest("POST", "/transaction/refund", { form: { refid: w.refid } });
  } catch {
    return back("refund_denied");
  }
  await db.withdrawal.update({ where: { id: w.id }, data: { status: "REFUND_REQUESTED" } });
  return back("refund_ok");
}
