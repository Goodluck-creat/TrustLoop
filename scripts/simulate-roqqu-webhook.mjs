// Sends a realistic, encrypted Roqqu webhook to your own site, so you can test everything
// before Roqqu can reach you.
//
//   node scripts/simulate-roqqu-webhook.mjs payment_link_completed <reference>
//   node scripts/simulate-roqqu-webhook.mjs payment_link_overpaid  <reference>
//   node scripts/simulate-roqqu-webhook.mjs payment_link_failed    <reference>
//   node scripts/simulate-roqqu-webhook.mjs token_received <address> <usdtAmount>
//   node scripts/simulate-roqqu-webhook.mjs token_sent     <refid>
//   node scripts/simulate-roqqu-webhook.mjs token_refunded <refid>
//
// Target: http://localhost:3000 by default, or set WEBHOOK_TARGET=https://your-site
import fs from "node:fs";
import crypto from "node:crypto";

const env = {};
try {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch {}
const key = (process.env.ROQQU_WEBHOOK_KEY || env.ROQQU_WEBHOOK_KEY || process.env.ROQQU_SECRET_KEY || env.ROQQU_SECRET_KEY || "").trim();
if (key.length < 32) {
  console.error("Your ROQQU_SECRET_KEY is missing or shorter than 32 characters. Roqqu uses its first 32 characters to encrypt webhooks.");
  process.exit(1);
}

const [type, a, b] = process.argv.slice(2);
const hash = "0x" + crypto.randomBytes(32).toString("hex");
const id = "evt_sim_" + crypto.randomBytes(6).toString("hex");
const now = new Date().toISOString();
const customer = { email: "test@trustloop.app", first_name: "Test", last_name: "User" };

function link(event_type, extra) {
  return {
    event_id: id, event_type, datetime: now,
    meta_data: {
      payment_link_refid: "link_" + id, payment_reference: a, amount_required: 1000, amount_currency: "ngn",
      amount_received: "0.67", amount_received_usd: 1000, overpaid_amount: "0", overpaid_amount_usd: 0,
      underpaid_amount: "0", underpaid_amount_usd: 0, token: "USDT", value: "0.67", hash, status: "completed",
      customer, address: "TSimulatedAddress", network: "trc20", metadata: {}, ...extra,
    },
  };
}
const events = {
  payment_link_completed: () => link("payment_link_completed", {}),
  payment_link_overpaid: () => link("payment_link_completed_overpaid", { overpaid_amount: "0.1", overpaid_amount_usd: 150 }),
  payment_link_failed: () => link("payment_link_failed", { status: "failed", underpaid_amount: "0.2", underpaid_amount_usd: 300 }),
  token_received: () => ({ event_id: id, event_type: "token_received", datetime: now,
    meta_data: { address: a, extra: null, network: "trc20", token: "usdt", value: b ?? "5", hash, status: "confirmed", customer } }),
  token_sent: () => ({ event_id: id, event_type: "token_sent", datetime: now,
    meta_data: { destination: "TDest", extra: null, network: "trc20", token: "usdt", value: "5", hash, reference: a, status: "processed" } }),
  token_refunded: () => ({ event_id: id, event_type: "token_refunded", datetime: now,
    meta_data: { network: "trc20", token: "usdt", value: "5", hash: "admin_refund", status: "confirmed", refid: a } }),
};
if (!events[type] || !a) {
  console.error("Usage: node scripts/simulate-roqqu-webhook.mjs <" + Object.keys(events).join("|") + "> <reference|address|refid> [amount]");
  process.exit(1);
}

const iv = crypto.randomBytes(16);
const c = crypto.createCipheriv("aes-256-ctr", Buffer.from(key.slice(0, 32), "utf8"), iv);
const cipher = Buffer.concat([c.update(Buffer.from(JSON.stringify(events[type]()), "utf8")), c.final()]).toString("hex");

const target = (process.env.WEBHOOK_TARGET || "http://localhost:3000").replace(/\/$/, "") + "/api/roqqu/webhook";
const res = await fetch(target, { method: "POST", headers: { "content-type": "application/json", "x-api-key": iv.toString("hex") }, body: JSON.stringify({ hash: cipher }) });
console.log(res.status, await res.text());
