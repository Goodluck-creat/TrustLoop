import { decryptWebhook } from "@/lib/payments/webhook-crypto";
import { processRoqquEvent } from "@/lib/payments/roqqu-events";

// Roqqu calls this address when money arrives or leaves.
// Set it as your webhook URL in the Roqqu dashboard:  https://<your-site>/api/roqqu/webhook
export async function POST(req: Request) {
  const keys = [process.env.ROQQU_WEBHOOK_KEY, process.env.ROQQU_SECRET_KEY].map((k) => k?.trim()).filter((k): k is string => Boolean(k));
  if (keys.length === 0) return Response.json({ error: "not configured" }, { status: 503 });

  let body: { hash?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  const iv = req.headers.get("x-api-key") ?? "";
  if (typeof body.hash !== "string" || !iv) return Response.json({ error: "bad request" }, { status: 400 });

  // A body that does not decrypt with our key did not come from Roqqu. Plain-text bodies are never accepted.
  let payload: unknown = null;
  for (const key of keys) {
    try {
      payload = decryptWebhook(body.hash, key, iv);
      break;
    } catch {
      /* try the next key */
    }
  }
  if (!payload || typeof payload !== "object") return Response.json({ error: "cannot verify" }, { status: 401 });

  try {
    const result = await processRoqquEvent(payload as Record<string, unknown>);
    return Response.json({ received: true, result });
  } catch (e) {
    console.error("[roqqu webhook] failed:", e);
    return Response.json({ error: "failed" }, { status: 500 }); // Roqqu can retry this event
  }
}
