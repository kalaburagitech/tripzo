import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { couponDiscount, couponRejection } from "./lib/pricing";
import { istDateString } from "./lib/time";

/**
 * Coupon & promotional discounts. The authoritative discount is always
 * recomputed server-side in bookings.quoteFare / bookings.createBooking.
 */

export const validateCoupon = query({
  args: { code: v.string(), bookingAmount: v.number(), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .first();
    const reason = couponRejection(coupon, args.bookingAmount, args.operatorId, istDateString());
    if (reason || !coupon) return { isValid: false, discountAmount: 0, message: reason ?? "Invalid coupon." };
    const discount = couponDiscount(coupon, args.bookingAmount);
    return {
      isValid: true,
      code: coupon.code,
      title: coupon.title,
      discountAmount: discount,
      message: `Coupon applied! You saved ₹${discount}`,
    };
  },
});

export const listActiveCoupons = query({
  args: {},
  handler: async (ctx) => {
    const today = istDateString();
    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return coupons
      .filter((c) => !c.validUntil || c.validUntil >= today)
      .map((c) => ({
        _id: c._id,
        code: c.code,
        title: c.title,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxDiscount: c.maxDiscount,
        minBookingAmount: c.minBookingAmount,
        validUntil: c.validUntil,
      }));
  },
});

export const listAllCoupons = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("coupons").order("desc").collect();
  },
});

export const createCoupon = mutation({
  args: {
    token: v.string(),
    code: v.string(),
    title: v.string(),
    description: v.string(),
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FLAT")),
    discountValue: v.number(),
    maxDiscount: v.optional(v.number()),
    minBookingAmount: v.number(),
    validUntil: v.string(),
    usageLimitPerUser: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const code = args.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new Error("Coupon code must be 3-20 letters/numbers.");
    if (args.discountValue <= 0) throw new Error("Discount must be greater than zero.");
    if (args.discountType === "PERCENTAGE" && args.discountValue > 100) {
      throw new Error("Percentage cannot exceed 100.");
    }
    const dupe = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (dupe) throw new Error("A coupon with this code already exists.");
    const { token: _t, ...rest } = args;
    return await ctx.db.insert("coupons", {
      ...rest,
      code,
      isActive: true,
      usageCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const setCouponActive = mutation({
  args: { token: v.string(), couponId: v.id("coupons"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.couponId, { isActive: args.isActive });
    return { success: true };
  },
});
