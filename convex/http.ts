import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// 1. Razorpay Webhook Handler
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.text();
      const eventData = JSON.parse(payload);
      const eventId = eventData.event_id || eventData.id || `evt_${Date.now()}`;
      const eventType = eventData.event || "unknown";

      await ctx.runMutation(api.payments.processWebhookEvent, {
        eventId,
        source: "RAZORPAY_PAYMENT",
        eventType,
        rawPayload: payload,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// 2. Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "healthy",
        service: "Tripzo Marketplace Backend",
        version: "1.0.0",
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
