import { Coupon } from '../types';
import { api, convexClient } from './convexClient';

export function toCoupon(c: any): Coupon {
  return {
    code: c.code,
    title: c.title,
    description: c.description,
    discountType: c.discountType === 'PERCENTAGE' ? 'percentage' : 'flat',
    discountValue: c.discountValue,
    maxDiscount: c.maxDiscount,
    minBookingAmount: c.minBookingAmount,
    expiryDate: c.validUntil,
  };
}

export const couponService = {
  async getAvailableCoupons(): Promise<Coupon[]> {
    try {
      const list = await convexClient.query(api.coupons.listActiveCoupons, {});
      return list.map(toCoupon);
    } catch {
      return [];
    }
  },
};
