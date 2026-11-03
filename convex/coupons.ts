import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Coupon & Promotional Discounts Engine
 */

// 1. Validate and Apply Coupon
export const validateCoupon = query({
  args: {
    code: v.string(),
    bookingAmount: v.number(),
    operatorId: v.optional(v.id("operators")),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.code.trim().toUpperCase();

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", cleanCode))
      .first();

    if (!coupon || !coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "Invalid or expired coupon code.",
      };
    }

    if (args.bookingAmount < coupon.minBookingAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `This coupon requires a minimum booking amount of ₹${coupon.minBookingAmount}.`,
      };
    }

    if (coupon.operatorId && args.operatorId && coupon.operatorId !== args.operatorId) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "This coupon is not applicable for this bus operator.",
      };
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.round((args.bookingAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      isValid: true,
      code: coupon.code,
      title: coupon.title,
      discountAmount: discount,
      message: `Coupon applied! You saved ₹${discount}`,
    };
  },
});

// 2. List Public Active Coupons (for Offers screen)
export const listActiveCoupons = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("coupons")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});
