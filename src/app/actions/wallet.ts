"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { payments } from "@/lib/payments";
import { ensureDepositAddress } from "@/lib/wallet";

// Starts a wallet top-up. Roqqu (live) or the simulator (sandbox) takes the payment.
export async function startDeposit(_prev: string | null, formData: FormData): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const amountNgn = Number(formData.get("amountNgn"));
  if (!Number.isInteger(amountNgn) || amountNgn < 100 || amountNgn > 5_000_000) {
    return "Enter a whole amount between ₦100 and ₦5,000,000.";
  }

  const reference = "TL" + randomBytes(7).toString("hex");
  let url: string;
  try {
    await db.deposit.create({ data: { userId, amountNgn, reference } });
    const link = await payments.createFundingLink({
      reference,
      amountNgn,
      taskTitle: "Wallet top-up",
      customerEmail: user.email,
      customerName: user.name,
    });
    url = link.url;
  } catch {
    return "Could not start the payment. Please try again.";
  }
  redirect(url);
}

export async function createMyWalletAddress() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  await ensureDepositAddress(userId);
  redirect("/wallet");
}
