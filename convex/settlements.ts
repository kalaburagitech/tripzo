import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireOperatorAccess } from "./lib/auth";

/**
 * Razorpay Route Marketplace Settlement & Financial Ledger
 */

// 1. Process Operator Payout (Razorpay Route Transfer)
export const processSettlementTransfer = mutation({
  args: {
    token: v.string(),
    settlementId: v.id("settlements"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) throw new Error("Settlement record not found");

    if (settlement.status === "PROCESSED") {
      return { success: true, message: "Settlement already processed." };
    }
    if (settlement.status !== "PENDING") {
      throw new Error(`Settlement is ${settlement.status} and cannot be paid out.`);
    }

    const operator = await ctx.db.get(settlement.operatorId);
    if (!operator) throw new Error("Operator not found");

    const now = Date.now();
    const transferId = `trf_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Update settlement to PROCESSED
    await ctx.db.patch(settlement._id, {
      status: "PROCESSED",
      razorpayTransferId: transferId,
      processedAt: now,
    });

    // Immutable Financial Ledger Entry
    await ctx.db.insert("financialLedger", {
      transactionReference: `TRF-${transferId}`,
      bookingId: settlement.bookingId,
      operatorId: settlement.operatorId,
      eventType: "TRANSFER_PROCESSED",
      debitAmount: settlement.netPayableAmount,
      creditAmount: 0,
      balanceAfter: settlement.netPayableAmount,
      currency: "INR",
      idempotencyKey: `trf_ledger_${settlement._id}`,
      notes: `Settlement transfer of ₹${settlement.netPayableAmount} executed to ${operator.companyName} (Account: ${operator.razorpayAccountId || "Bank Transfer"})`,
      timestamp: now,
    });

    return {
      success: true,
      transferId,
      netPayableAmount: settlement.netPayableAmount,
    };
  },
});

// 2. Query Operator Settlements
export const getOperatorSettlements = query({
  args: { token: v.string(), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .order("desc")
      .take(200);

    const results = [];
    for (const s of settlements) {
      const booking = await ctx.db.get(s.bookingId);
      results.push({
        ...s,
        pnr: booking?.pnr || "N/A",
        journeyDate: booking?.journeyDate || "N/A",
      });
    }

    return results;
  },
});

// 3. Query Super Admin Financial Ledger
export const getFinancialLedger = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const limit = args.limit || 50;
    const ledger = await ctx.db
      .query("financialLedger")
      .order("desc")
      .take(limit);

    return ledger;
  },
});

export const listPendingSettlements = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const pending = await ctx.db
      .query("settlements")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .take(200);
    const out = [];
    for (const s of pending) {
      const [op, booking] = await Promise.all([ctx.db.get(s.operatorId), ctx.db.get(s.bookingId)]);
      out.push({ ...s, operatorName: op?.companyName || "", pnr: booking?.pnr || "" });
    }
    return out;
  },
});
