import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Real-time Analytics & Executive Reports
 */

// 1. Super Admin Executive Overview
export const getSuperAdminMetrics = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    const operators = await ctx.db.query("operators").collect();
    const buses = await ctx.db.query("buses").collect();
    const trips = await ctx.db.query("trips").collect();
    const settlements = await ctx.db.query("settlements").collect();

    let grossBookingValue = 0;
    let totalPlatformCommission = 0;
    let operatorPayableTotal = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    for (const b of bookings) {
      if (b.bookingStatus === "CONFIRMED") {
        grossBookingValue += b.totalAmount;
        totalPlatformCommission += b.commissionAmount;
        operatorPayableTotal += b.operatorShareAmount;
        confirmedCount++;
      } else if (b.bookingStatus === "CANCELLED") {
        cancelledCount++;
      }
    }

    const pendingSettlementAmount = settlements
      .filter((s) => s.status === "PENDING")
      .reduce((acc, curr) => acc + curr.netPayableAmount, 0);

    const activeOperatorsCount = operators.filter(
      (o) => o.status === "ACTIVE" || o.status === "APPROVED"
    ).length;

    const pendingApprovalsCount = operators.filter(
      (o) => o.status === "PENDING" || o.status === "UNDER_REVIEW"
    ).length;

    return {
      grossBookingValue,
      totalPlatformCommission,
      operatorPayableTotal,
      pendingSettlementAmount,
      totalBookings: bookings.length,
      confirmedBookings: confirmedCount,
      cancelledBookings: cancelledCount,
      totalOperators: operators.length,
      activeOperators: activeOperatorsCount,
      pendingApprovals: pendingApprovalsCount,
      totalBuses: buses.length,
      totalTrips: trips.length,
    };
  },
});

// 2. Operator Business Overview
export const getOperatorMetrics = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) return null;

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    const buses = await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    let totalRevenue = 0;
    let totalCommissionDeducted = 0;
    let netPayout = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    for (const b of bookings) {
      if (b.bookingStatus === "CONFIRMED") {
        totalRevenue += b.totalAmount;
        totalCommissionDeducted += b.commissionAmount;
        netPayout += b.operatorShareAmount;
        confirmedCount++;
      } else if (b.bookingStatus === "CANCELLED") {
        cancelledCount++;
      }
    }

    const pendingPayout = settlements
      .filter((s) => s.status === "PENDING")
      .reduce((acc, curr) => acc + curr.netPayableAmount, 0);

    return {
      operatorName: operator.companyName,
      status: operator.status,
      commissionRate: operator.commissionRate,
      totalRevenue,
      totalCommissionDeducted,
      netPayout,
      pendingPayout,
      totalBookings: bookings.length,
      confirmedBookings: confirmedCount,
      cancelledBookings: cancelledCount,
      fleetCount: buses.length,
      scheduledTripsCount: trips.length,
    };
  },
});
