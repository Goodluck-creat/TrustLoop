import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { asRecord, isProdKey } from "./client";
import { getNgnPerUsdt } from "./rates";

// Turns a decrypted Roqqu webhook into changes in our database.
// Every event is applied once: the event id is stored first, and a repeat is ignored.
export type EventResult = "ok" | "duplicate" | "ignored";

type RoqquEvent = { event_id?: unknown; event_type?: unknown; meta_data?: unknown; datetime?: unknown };

class Ignored extends Error {}
type Tx = Prisma.TransactionClient;

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function processRoqquEvent(evt: RoqquEvent): Promise<EventResult> {
  const eventId = str(evt.event_id);
  const type = str(evt.event_type);
  const meta = asRecord(evt.meta_data);
  if (!eventId || !type) return "ignored";

  // Only the USDT-to-naira price needs a network call, so do it before the transaction.
  const rate = type === "token_received" ? (await getNgnPerUsdt()).rate : 0;

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { eventId, type: `roqqu_${type}` } });
      switch (type) {
        case "payment_link_completed":
          return paymentLink(tx, meta, false);
        case "payment_link_completed_overpaid":
          return paymentLink(tx, meta, true);
        case "payment_link_failed":
          return paymentLinkFailed(tx, meta);
        case "token_received":
          return tokenReceived(tx, meta, rate);
        case "token_sent":
          return tokenSent(tx, meta);
        case "token_refunded":
          return tokenRefunded(tx, meta);
        default:
          throw new Ignored(); // not an event we use
      }
    });
    return "ok";
  } catch (e) {
    if (e instanceof Ignored) return "ignored";
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate";
    throw e;
  }
}

function log(tx: Tx, data: { kind: string; userId?: string | null; reference?: string; hash?: string; token?: string; network?: string; value?: number | null; amountNgn?: number | null; status: string; note?: string }) {
  return tx.roqquTx.create({
    data: {
      kind: data.kind,
      live: isProdKey(),
      userId: data.userId ?? null,
      reference: data.reference || null,
      hash: data.hash || null,
      token: data.token ? data.token.toLowerCase() : null,
      network: data.network ? data.network.toLowerCase() : null,
      value: data.value ?? null,
      amountNgn: data.amountNgn ?? null,
      status: data.status,
      note: data.note ?? null,
    },
  });
}

// A hirer paid a Roqqu payment link. The payment_reference is the reference we created.
async function findDeposit(tx: Tx, meta: Record<string, unknown>) {
  const refs = [str(meta.payment_reference), str(asRecord(meta.metadata).reference)].filter(Boolean);
  if (refs.length === 0) throw new Ignored();
  const dep = await tx.deposit.findFirst({ where: { reference: { in: refs } } });
  if (!dep) throw new Ignored();
  return dep;
}

async function paymentLink(tx: Tx, meta: Record<string, unknown>, overpaid: boolean) {
  const dep = await findDeposit(tx, meta);
  if (dep.status === "CONFIRMED") return;
  const hash = str(meta.hash);
  const network = str(meta.network).toLowerCase();
  const token = str(meta.token).toLowerCase();
  await tx.deposit.update({ where: { id: dep.id }, data: { status: "CONFIRMED", txHash: hash || null, network: network || null, token: token || null } });
  // Same reference the simulator uses, so one payment can never be credited twice.
  await tx.ledgerEntry.create({
    data: { userId: dep.userId, type: "DEPOSIT", amountNgn: dep.amountNgn, reference: `DEP_${dep.reference}`, note: "Wallet top-up" },
  });
  await log(tx, {
    kind: "PAYMENT_LINK",
    userId: dep.userId,
    reference: dep.reference,
    hash,
    token,
    network,
    value: num(meta.value),
    amountNgn: dep.amountNgn,
    status: overpaid ? "OVERPAID" : "COMPLETED",
    note: overpaid ? `Overpaid by ${str(meta.overpaid_amount)} ${token}` : undefined,
  });
  await notify(
    tx,
    dep.userId,
    "Money added",
    overpaid
      ? `${naira(dep.amountNgn)} was added to your wallet. You paid a little extra, so please contact support if you want the difference back.`
      : `${naira(dep.amountNgn)} was added to your wallet.`,
    "/wallet",
  );
}

// The customer paid too little (or the payment failed). Nothing is credited.
async function paymentLinkFailed(tx: Tx, meta: Record<string, unknown>) {
  const dep = await findDeposit(tx, meta);
  if (dep.status !== "PENDING") return;
  await tx.deposit.update({ where: { id: dep.id }, data: { status: "FAILED", txHash: str(meta.hash) || null } });
  await log(tx, {
    kind: "PAYMENT_LINK",
    userId: dep.userId,
    reference: dep.reference,
    hash: str(meta.hash),
    token: str(meta.token),
    network: str(meta.network),
    value: num(meta.value),
    amountNgn: dep.amountNgn,
    status: "FAILED",
    note: `Underpaid by ${str(meta.underpaid_amount)} ${str(meta.token).toLowerCase()}`,
  });
  await notify(tx, dep.userId, "Payment not completed", "Your payment did not reach the full amount, so nothing was added. Please try again.", "/wallet");
}

// USDT arrived at a user's own Roqqu address (not through a payment link).
async function tokenReceived(tx: Tx, meta: Record<string, unknown>, rate: number) {
  const token = str(meta.token).toLowerCase();
  const status = str(meta.status).toLowerCase();
  const hash = str(meta.hash);
  const address = str(meta.address);
  if (token !== "usdt" || !hash || !address || (status && status !== "confirmed")) throw new Ignored();

  const row = await tx.depositAddress.findFirst({ where: { address } });
  const userId = row?.userId ?? (await tx.user.findFirst({ where: { depositAddress: address }, select: { id: true } }))?.id;
  if (!userId) throw new Ignored();

  const value = num(meta.value);
  const amountNgn = value && rate ? Math.floor(value * rate) : 0;
  if (amountNgn < 1) throw new Ignored();

  await tx.ledgerEntry.create({
    data: { userId, type: "DEPOSIT", amountNgn, reference: `CH_${hash}`, note: `USDT received (${str(meta.network).toUpperCase()})` },
  });
  await log(tx, { kind: "CHAIN_DEPOSIT", userId, reference: address, hash, token, network: str(meta.network), value, amountNgn, status: "CONFIRMED" });
  await notify(tx, userId, "Money added", `${value} USDT arrived at your wallet address. ${naira(amountNgn)} was added to your balance.`, "/wallet");
}

// A withdrawal left Roqqu and has an on-chain hash.
async function tokenSent(tx: Tx, meta: Record<string, unknown>) {
  const refid = str(meta.reference);
  if (!refid) throw new Ignored();
  const w = await tx.withdrawal.findFirst({ where: { refid } });
  if (!w) throw new Ignored();
  const hash = str(meta.hash);
  if (w.status !== "COMPLETED") {
    await tx.withdrawal.update({ where: { id: w.id }, data: { status: "COMPLETED", txHash: hash || w.txHash } });
    await notify(tx, w.userId, "Withdrawal sent", `${naira(w.amountNgn - w.feeNgn)} was sent as ${w.asset} on ${w.network}.`, "/wallet");
  }
  await log(tx, { kind: "SEND", userId: w.userId, reference: w.reference, hash, token: str(meta.token), network: str(meta.network), value: num(meta.value), amountNgn: w.amountNgn, status: "SENT" });
}

// A send failed and Roqqu refunded it, so the money goes back to the user's wallet.
async function tokenRefunded(tx: Tx, meta: Record<string, unknown>) {
  const refid = str(meta.refid);
  if (!refid) throw new Ignored();
  const w = await tx.withdrawal.findFirst({ where: { refid } });
  if (!w) throw new Ignored();
  if (w.status === "FAILED") return;
  await tx.withdrawal.update({ where: { id: w.id }, data: { status: "FAILED" } });
  await tx.ledgerEntry.create({
    data: { userId: w.userId, type: "REFUND", amountNgn: w.amountNgn, reference: `${w.reference}_rev`, note: "Withdrawal refunded" },
  });
  await log(tx, { kind: "REFUND", userId: w.userId, reference: w.reference, hash: str(meta.hash), token: str(meta.token), network: str(meta.network), value: num(meta.value), amountNgn: w.amountNgn, status: "REFUNDED" });
  await notify(tx, w.userId, "Withdrawal returned", `${naira(w.amountNgn)} was returned to your wallet because the transfer did not go through.`, "/wallet");
}
