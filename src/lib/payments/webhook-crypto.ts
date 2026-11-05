import { createDecipheriv, createCipheriv } from "crypto";

// Roqqu encrypts every webhook body (see "Decrypt Webhook Body" in their docs):
//   algorithm aes-256-ctr, key = first 32 characters of the API key,
//   IV = the x-api-key header of the webhook request (hex), ciphertext = body.hash (hex).
// Only someone who holds our API key can produce a body that decrypts to valid JSON,
// so a successful decrypt is also our proof that the request came from Roqqu.
export function decryptWebhook(hashHex: string, apiKey: string, ivHex: string): unknown {
  const key = Buffer.from(apiKey.slice(0, 32), "utf8");
  if (key.length !== 32) throw new Error("API key is shorter than 32 characters");
  const iv = Buffer.from(ivHex, "hex");
  if (iv.length !== 16) throw new Error("Bad IV");
  const d = createDecipheriv("aes-256-ctr", key, iv);
  const text = Buffer.concat([d.update(Buffer.from(hashHex, "hex")), d.final()]).toString("utf8");
  return JSON.parse(text);
}

// Used only by the local test script to build a realistic webhook.
export function encryptWebhook(payload: unknown, apiKey: string, ivHex: string): string {
  const key = Buffer.from(apiKey.slice(0, 32), "utf8");
  const c = createCipheriv("aes-256-ctr", key, Buffer.from(ivHex, "hex"));
  return Buffer.concat([c.update(Buffer.from(JSON.stringify(payload), "utf8")), c.final()]).toString("hex");
}
