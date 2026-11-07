import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Razorpay webhook: verified with RAZORPAY_WEBHOOK_SECRET (X-Razorpay-Signature header)
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return json(503, { error: "Webhook secret not configured" });

    const payload = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    if ((await hmacSha256Hex(secret, payload)) !== signature) {
      return json(401, { error: "Invalid signature" });
    }

    try {
      const eventData = JSON.parse(payload);
      const eventId = request.headers.get("x-razorpay-event-id") || eventData.id || `evt_${Date.now()}`;
      await ctx.runMutation(internal.payments.processWebhookEvent, {
        eventId,
        source: "RAZORPAY_PAYMENT",
        eventType: eventData.event || "unknown",
        rawPayload: payload,
      });
      return json(200, { status: "ok" });
    } catch (err: any) {
      return json(400, { error: err?.message || "Bad payload" });
    }
  }),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () =>
    json(200, { status: "healthy", service: "Tripzo Marketplace Backend", version: "1.1.0", timestamp: Date.now() })
  ),
});

export default http;
