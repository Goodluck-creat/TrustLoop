import { db } from "@/lib/db";
import { payments } from "@/lib/payments";

// Gives a user a Roqqu deposit address (USDT, TRC20) if they do not have one yet.
export async function ensureDepositAddress(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.depositAddress) return user;

  const [first, ...rest] = user.name.trim().split(/\s+/);
  const wallet = await payments.createWallet({
    email: user.email,
    firstName: first || "TrustLoop",
    lastName: rest.join(" ") || "User",
    network: "trc20",
  });
  // Only the first writer wins, so two parallel calls cannot overwrite each other.
  await db.user.updateMany({
    where: { id: userId, depositAddress: null },
    data: { depositAddress: wallet.address, depositNetwork: wallet.network, depositSandbox: wallet.sandbox },
  });
  return db.user.findUnique({ where: { id: userId } });
}
