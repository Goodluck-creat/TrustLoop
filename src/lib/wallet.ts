import { db } from "@/lib/db";
import { payments } from "@/lib/payments";

export const NETWORKS = ["trc20", "bep20"] as const;
export type DepositNetwork = (typeof NETWORKS)[number];

// Gives a user a Roqqu deposit address (USDT) on the given network if they do not have one yet.
// The first network (trc20) is also mirrored on the user row for older code.
export async function ensureDepositAddress(userId: string, network: DepositNetwork = "trc20") {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const have = await db.depositAddress.findUnique({ where: { userId_network: { userId, network } } });
  if (have) return have;

  // An address made before multi-network support lives on the user row.
  if (user.depositAddress && (user.depositNetwork ?? "trc20").toLowerCase() === network) {
    return db.depositAddress.upsert({
      where: { userId_network: { userId, network } },
      update: {},
      create: { userId, network, address: user.depositAddress, sandbox: user.depositSandbox },
    });
  }

  const [first, ...rest] = user.name.trim().split(/\s+/);
  const wallet = await payments.createWallet({
    email: user.email,
    firstName: first || "TrustLoop",
    lastName: rest.join(" ") || "User",
    network,
  });
  // The unique (user, network) key means two parallel calls cannot create two addresses.
  const row = await db.depositAddress.upsert({
    where: { userId_network: { userId, network } },
    update: {},
    create: { userId, network, address: wallet.address, sandbox: wallet.sandbox },
  });
  if (network === "trc20") {
    await db.user.updateMany({
      where: { id: userId, depositAddress: null },
      data: { depositAddress: row.address, depositNetwork: network, depositSandbox: row.sandbox },
    });
  }
  return row;
}

export async function listDepositAddresses(userId: string) {
  const [rows, user] = await Promise.all([
    db.depositAddress.findMany({ where: { userId } }),
    db.user.findUnique({ where: { id: userId } }),
  ]);
  const out = rows.map((r) => ({ network: r.network, address: r.address, sandbox: r.sandbox }));
  if (user?.depositAddress && !out.some((o) => o.network === (user.depositNetwork ?? "trc20").toLowerCase())) {
    out.push({ network: (user.depositNetwork ?? "trc20").toLowerCase(), address: user.depositAddress, sandbox: user.depositSandbox });
  }
  return out;
}
