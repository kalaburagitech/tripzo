import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireOperatorAccess } from "./lib/auth";
import { istDateString } from "./lib/time";

/**
 * Real-time Analytics & Executive Reports
 */

// 1. Super Admin Executive Overview
export const getSuperAdminMetrics = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
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
  args: { token: v.string(), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();

    const buses = await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
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

// 3. Public marketplace stats (safe for the landing page)
export const getPublicStats = query({
  args: {},
  handler: async (ctx) => {
    const operators = await ctx.db.query("operators").collect();
    const buses = await ctx.db.query("buses").collect();
    const routes = await ctx.db.query("routes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const today = istDateString();
    const upcoming = await ctx.db
      .query("trips")
      .withIndex("by_liveStatus", (q) => q.eq("liveStatus", "SCHEDULED"))
      .collect();
    const cities = new Set<string>();
    routes.forEach((r) => {
      cities.add(r.fromCity);
      cities.add(r.toCity);
    });
    return {
      liveOperators: operators.filter((o) => o.status === "ACTIVE" || o.status === "APPROVED").length,
      buses: buses.filter((b) => b.status === "ACTIVE").length,
      routes: routes.length,
      cities: cities.size,
      upcomingTrips: upcoming.filter((t) => t.journeyDate >= today).length,
    };
  },
});
