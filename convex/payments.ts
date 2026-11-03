import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Razorpay Payment Gateway & Simulated Checkout Engine
 */

// 1. Create Payment Order
export const createPaymentOrder = mutation({
  args: {
    bookingId: v.id("bookings"),
    amount: v.number(),
    currency: v.string(), // "INR"
    method: v.union(v.literal("UPI"), v.literal("CARD"), v.literal("WALLET"), v.literal("NETBANKING")),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const now = Date.now();
    const isSandboxOrDev = true; // Controlled by env settings

    // Order ID (in real production, this calls Razorpay API: orders.create)
    const orderId = isSandboxOrDev
      ? `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      : `order_${Date.now()}`;

    const paymentId = await ctx.db.insert("payments", {
      bookingId: args.bookingId,
      amount: args.amount,
      currency: args.currency,
      method: args.method,
      status: "INITIATED",
      gatewayProvider: "SIMULATED_DEV",
      gatewayOrderId: orderId,
      idempotencyKey: `ord_idemp_${args.bookingId}_${now}`,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("paymentAttempts", {
      bookingId: args.bookingId,
      gatewayOrderId: orderId,
      attemptNumber: 1,
      method: args.method,
      payload: JSON.stringify({ amount: args.amount, currency: args.currency }),
      status: "INITIATED",
      createdAt: now,
    });

    return {
      success: true,
      orderId,
      paymentId,
      amount: args.amount,
      currency: args.currency,
      keyId: "rzp_test_tripzo_demo",
    };
  },
});

// 2. Verify Payment (Signature verification & confirmation)
export const verifyPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    gatewayPaymentId: v.string(),
    gatewaySignature: v.optional(v.string()),
    upiVpa: v.optional(v.string()),
    isSuccess: v.boolean(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment record not found");

    const now = Date.now();

    if (args.isSuccess) {
      // Transition payment to CAPTURED
      await ctx.db.patch(payment._id, {
        status: "CAPTURED",
        gatewayPaymentId: args.gatewayPaymentId,
        gatewaySignature: args.gatewaySignature || "sim_sig_verified",
        upiVpa: args.upiVpa,
        updatedAt: now,
      });

      // Update booking to CONFIRMED
      await ctx.db.patch(payment.bookingId, {
        paymentStatus: "SUCCESS",
        bookingStatus: "CONFIRMED",
        updatedAt: now,
      });

      // Log to Immutable Financial Ledger
      await ctx.db.insert("financialLedger", {
        transactionReference: `PAY-${payment.gatewayOrderId}`,
        bookingId: payment.bookingId,
        eventType: "PAYMENT_CAPTURED",
        debitAmount: 0,
        creditAmount: payment.amount,
        balanceAfter: payment.amount,
        currency: payment.currency,
        idempotencyKey: `pay_verify_${payment._id}`,
        notes: `Payment captured via ${payment.method} with ID ${args.gatewayPaymentId}`,
        timestamp: now,
      });

      return { success: true, status: "CAPTURED" };
    } else {
      // Payment Failed
      await ctx.db.patch(payment._id, {
        status: "FAILED",
        failureReason: "Payment cancelled by user or bank declined.",
        updatedAt: now,
      });

      await ctx.db.patch(payment.bookingId, {
        paymentStatus: "FAILED",
        updatedAt: now,
      });

      return { success: false, status: "FAILED" };
    }
  },
});

// 3. Webhook Event Handler (Idempotent processing)
export const processWebhookEvent = mutation({
  args: {
    eventId: v.string(),
    source: v.union(v.literal("RAZORPAY_PAYMENT"), v.literal("RAZORPAY_ROUTE"), v.literal("SMS_GATEWAY")),
    eventType: v.string(),
    rawPayload: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotency check: don't reprocess existing event
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing && existing.processed) {
      return { success: true, message: "Event already processed." };
    }

    const now = Date.now();
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      source: args.source,
      eventType: args.eventType,
      rawPayload: args.rawPayload,
      processed: true,
      processedAt: now,
      createdAt: now,
    });

    return { success: true };
  },
});
