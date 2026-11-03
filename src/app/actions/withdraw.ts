"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { getBalance } from "@/lib/money";
import { notify } from "@/lib/notify";
import { payments } from "@/lib/payments";

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

  const reference = "TL" + randomBytes(7).toString("hex");
  try {
    await db.$transaction(
      async (tx) => {
        const { balance } = await getBalance(tx, userId);
        if (amountNgn > balance) throw new Error("INSUFFICIENT");
        await tx.withdrawal.create({ data: { userId, amountNgn, asset, network, address, reference } });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return "That is more than your available balance.";
    return "Could not start the withdrawal. Please try again.";
  }

  try {
    const res = await payments.sendPayout({ reference, amountNgn });
    if (res.txHash) {
      await db.withdrawal.update({ where: { reference }, data: { status: "COMPLETED", txHash: res.txHash } });
      await notify(db, userId, "Withdrawal sent", `₦${amountNgn.toLocaleString("en-NG")} was sent as ${asset} on ${network}.`, "/dashboard");
    }
  } catch {
    await db.withdrawal.update({ where: { reference }, data: { status: "FAILED" } });
    return "The transfer failed and your balance was not charged. Please try again.";
  }
  redirect("/dashboard?w=ok");
}