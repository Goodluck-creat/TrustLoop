"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import { notify } from "@/lib/notify";
import { payments } from "@/lib/payments";
import { lookupCustomer } from "@/lib/payments/customers";
import { withdrawalFee } from "@/lib/platform-fee";

const ASSETS: Record<string, string[]> = { USDC: ["BASE"], USDT: ["TRC20", "BEP20"] };

export async function requestWithdrawal(_prev: string | null, formData: FormData) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const amountNgn = Number(formData.get("amountNgn"));
  const asset = String(formData.get("asset") ?? "");
  const network = String(formData.get("network") ?? "");
  const address = String(formData.get("address") ?? "").trim();

  if (!ASSETS[asset]?.includes(network)) return "Choose a supported asset and network.";
  if (!Number.isInteger(amountNgn) || amountNgn < 100) return "Enter a whole amount of at least ₦100.";
  if (!/^[A-Za-z0-9]{26,64}$/.test(address)) return "Enter a valid wallet address.";

  // With live Roqqu, an account Roqqu has blacklisted cannot withdraw.
  const me = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (me) {
    const customer = await lookupCustomer(me.email);
    if (customer?.blacklisted) return "Withdrawals are paused for your account. Please contact support.";
  }

  // TrustLoop keeps a small fee. The user is debited the full amount and receives the rest.
  const { percent, fee, net } = withdrawalFee(amountNgn);
  if (net < 50) return "That amount is too small after the fee. Try a larger amount.";

  const reference = "TL" + randomBytes(7).toString("hex");
  try {
    await db.$transaction(
      async (tx) => {
        const { balance } = await getBalance(tx, userId);
        if (amountNgn > balance) throw new Error("INSUFFICIENT");
        await tx.withdrawal.create({ data: { userId, amountNgn, asset, network, address, reference, feeNgn: fee, feePercent: percent } });
        await tx.ledgerEntry.create({
          data: { userId, type: "WITHDRAWAL", amountNgn: -amountNgn, reference, note: `${asset} on ${network}${fee ? ` (fee ₦${fee.toLocaleString("en-NG")})` : ""}` },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return "That is more than your available balance.";
    return "Could not start the withdrawal. Please try again.";
  }

  try {
    const res = await payments.sendPayout({
      reference,
      amountNgn: net, // the fee stays with TrustLoop, so only the rest is sent
      toAddress: address,
      network: network.toLowerCase(),
      token: asset.toLowerCase(),
    });
    if (res.txHash) {
      // The simulator finishes at once.
      await db.withdrawal.update({ where: { reference }, data: { status: "COMPLETED", txHash: res.txHash } });
      await notify(db, userId, "Withdrawal sent", `₦${net.toLocaleString("en-NG")} was sent as ${asset} on ${network}.`, "/dashboard");
    } else if (res.refid) {
      // Roqqu queued it. The "token_sent" webhook (or a status check) completes it.
      await db.withdrawal.update({ where: { reference }, data: { status: "PROCESSING", refid: res.refid } });
    }
  } catch {
    // The transfer failed, so put the money back in the wallet.
    await db.$transaction([
      db.withdrawal.update({ where: { reference }, data: { status: "FAILED" } }),
      db.ledgerEntry.create({
        data: { userId, type: "REFUND", amountNgn, reference: `${reference}_rev`, note: "Withdrawal reversed" },
      }),
    ]);
    return "The transfer failed and your balance was not charged. Please try again.";
  }
  redirect("/wallet?m=withdrawn");
}
