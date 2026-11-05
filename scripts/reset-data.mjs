// Wipes TrustLoop test data so you can start fresh with real users.
//
//   node scripts/reset-data.mjs                       -> only SHOWS what would be deleted
//   node scripts/reset-data.mjs --yes                 -> deletes EVERYTHING (all users too)
//   node scripts/reset-data.mjs --yes --keep=you@mail.com,other@mail.com
//                                                     -> deletes everything except those accounts
//                                                        (their wallets, tasks and history are cleared)
//
// Your live site uses this same database, so the live site is reset too.
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"]*)"?\s*$/);
    if (m) process.env.DATABASE_URL = m[1];
  }
}
const args = process.argv.slice(2);
const yes = args.includes("--yes");
const keepArg = args.find((a) => a.startsWith("--keep="));
const keep = keepArg ? keepArg.slice(7).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) : [];

let host = "unknown";
try { host = new URL(process.env.DATABASE_URL).host; } catch {}

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const acc = (name) => name[0].toLowerCase() + name.slice(1);

export async function run(db, log = console.log) {
  const others = models.filter((m) => m !== "User");
  const keepUsers = keep.length ? await db.user.findMany({ where: { email: { in: keep } }, select: { id: true, email: true } }) : [];
  if (keep.length && keepUsers.length !== keep.length) {
    const found = keepUsers.map((u) => u.email.toLowerCase());
    log("These emails were not found, check the spelling: " + keep.filter((k) => !found.includes(k)).join(", "));
    return false;
  }
  const keepIds = keepUsers.map((u) => u.id);
  // Profile pictures of kept accounts stay.
  const whereFor = (m) => (m === "UserImage" && keepIds.length ? { userId: { notIn: keepIds } } : {});

  log(`\nDatabase: ${host}`);
  log(keep.length ? `Keeping ${keep.length} account(s): ${keep.join(", ")}` : "Keeping no accounts (everything goes).");
  log("\nRows that would be deleted:");
  for (const m of [...others, "User"]) {
    const where = m === "User" ? (keepIds.length ? { id: { notIn: keepIds } } : {}) : whereFor(m);
    log(`  ${m.padEnd(16)} ${await db[acc(m)].count({ where })}`);
  }
  if (!yes) {
    log("\nNothing was deleted. Add --yes to really delete.");
    return true;
  }

  // Delete child tables first. If the database complains about a link, try that table again later.
  let pending = [...others];
  for (let pass = 0; pass < 8 && pending.length; pass++) {
    const next = [];
    for (const m of pending) {
      try { await db[acc(m)].deleteMany({ where: whereFor(m) }); } catch (e) { if (/foreign key|23001|23503/i.test(String(e?.message))) next.push(m); else throw e; }
    }
    pending = next;
  }
  if (pending.length) throw new Error("Could not clear: " + pending.join(", "));
  await db.user.deleteMany({ where: keepIds.length ? { id: { notIn: keepIds } } : {} });
  if (keepIds.length) {
    await db.user.updateMany({
      where: { id: { in: keepIds } },
      data: { depositAddress: null, depositNetwork: null, depositSandbox: false, roqquStatus: null, roqquCheckedAt: null },
    });
  }
  log("\nDone. The database is clean. Log out and sign up again" + (keep.length ? " (or log in with a kept account)." : "."));
  return true;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("reset-data.mjs")) {
  const db = new PrismaClient();
  try { await run(db); } finally { await db.$disconnect(); }
}
