import { Doc } from "../_generated/dataModel";

export const CONVENIENCE_FEE = 49;
export const GST_RATE = 0.05;

export function couponDiscount(coupon: Doc<"coupons">, amount: number): number {
  let discount =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((amount * coupon.discountValue) / 100)
      : coupon.discountValue;
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  return Math.max(0, Math.min(discount, amount));
}

/** Returns a reason string when the coupon cannot be used, otherwise null. */
export function couponRejection(
  coupon: Doc<"coupons"> | null,
  amount: number,
  operatorId: string | undefined,
  todayIst: string
): string | null {
  if (!coupon || !coupon.isActive) return "Invalid or expired coupon code.";
  if (coupon.validUntil && coupon.validUntil < todayIst) return "This coupon has expired.";
  if (amount < coupon.minBookingAmount)
    return `This coupon requires a minimum booking amount of ₹${coupon.minBookingAmount}.`;
  if (coupon.operatorId && operatorId && coupon.operatorId !== operatorId)
    return "This coupon is not applicable for this bus operator.";
  return null;
}

export function fareBreakdown(seatTotal: number, discount: number, commissionRate: number) {
  const taxable = Math.max(0, seatTotal - discount);
  const taxAmount = Math.round(taxable * GST_RATE);
  const totalAmount = taxable + CONVENIENCE_FEE + taxAmount;
  const commissionAmount = Math.round((seatTotal * commissionRate) / 100);
  const operatorShareAmount = totalAmount - commissionAmount - CONVENIENCE_FEE;
  return {
    baseFare: seatTotal,
    discountAmount: discount,
    convenienceFee: CONVENIENCE_FEE,
    taxAmount,
    totalAmount,
    commissionAmount,
    operatorShareAmount,
  };
}

export function refundFor(
  totalAmount: number,
  hoursBeforeDeparture: number,
  policy: { ninetyPercentWindowHours: number; fiftyPercentWindowHours: number }
) {
  let refundPercent = 0;
  if (hoursBeforeDeparture >= policy.ninetyPercentWindowHours) refundPercent = 90;
  else if (hoursBeforeDeparture >= policy.fiftyPercentWindowHours) refundPercent = 50;
  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  return { refundPercent, refundAmount, cancellationFee: totalAmount - refundAmount };
}
