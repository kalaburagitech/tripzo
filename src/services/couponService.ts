import { Coupon } from '../types';
import { COUPONS } from '../data/dummyData';

export const couponService = {
  getAvailableCoupons(): Coupon[] {
    return COUPONS;
  },

  validateAndApply(
    code: string,
    bookingAmount: number
  ): { valid: boolean; discountAmount: number; coupon?: Coupon; message: string } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = COUPONS.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Invalid coupon code. Try TRIPZO10 or WELCOME100.',
      };
    }

    if (bookingAmount < coupon.minBookingAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `This coupon requires a minimum booking amount of ₹${coupon.minBookingAmount}.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((bookingAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    // Safety check so discount doesn't exceed total amount
    discount = Math.min(discount, bookingAmount);

    return {
      valid: true,
      discountAmount: discount,
      coupon,
      message: `Coupon ${coupon.code} applied! You saved ₹${discount}.`,
    };
  },
};
