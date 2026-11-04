const test = require("node:test");
const assert = require("node:assert/strict");

// Coupon Validation Engine (Mirroring src/services/couponService.ts & convex/coupons.ts)
const COUPONS = [
  {
    code: "TRIPZO10",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 150,
    minBookingAmount: 500,
  },
  {
    code: "WELCOME100",
    discountType: "flat",
    discountValue: 100,
    maxDiscount: undefined,
    minBookingAmount: 400,
  },
  {
    code: "WEEKEND15",
    discountType: "percentage",
    discountValue: 15,
    maxDiscount: 250,
    minBookingAmount: 800,
  },
];

function validateCoupon(code, bookingAmount) {
  const cleanCode = (code || "").trim().toUpperCase();
  const coupon = COUPONS.find((c) => c.code === cleanCode);

  if (!coupon) {
    return { valid: false, discountAmount: 0, message: "Invalid coupon code." };
  }

  if (bookingAmount < coupon.minBookingAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum booking of ₹${coupon.minBookingAmount} required.`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((bookingAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, bookingAmount);

  return {
    valid: true,
    discountAmount: discount,
    finalAmount: bookingAmount - discount,
  };
}

test("Coupon TRIPZO10 applies 10% discount up to max ₹150 cap", () => {
  // ₹1,000 booking: 10% is ₹100 (< 150 cap)
  const res1 = validateCoupon("TRIPZO10", 1000);
  assert.equal(res1.valid, true);
  assert.equal(res1.discountAmount, 100);
  assert.equal(res1.finalAmount, 900);

  // ₹2,000 booking: 10% is ₹200, but capped at ₹150
  const res2 = validateCoupon("TRIPZO10", 2000);
  assert.equal(res2.valid, true);
  assert.equal(res2.discountAmount, 150);
  assert.equal(res2.finalAmount, 1850);
});

test("Coupon WELCOME100 applies flat ₹100 discount above minimum threshold", () => {
  // Below threshold (₹300 < ₹400 minimum)
  const resInvalid = validateCoupon("WELCOME100", 300);
  assert.equal(resInvalid.valid, false);
  assert.equal(resInvalid.discountAmount, 0);

  // Above threshold (₹650)
  const resValid = validateCoupon("WELCOME100", 650);
  assert.equal(resValid.valid, true);
  assert.equal(resValid.discountAmount, 100);
  assert.equal(resValid.finalAmount, 550);
});

test("Coupon WEEKEND15 enforces ₹800 minimum and caps at ₹250", () => {
  const belowMin = validateCoupon("WEEKEND15", 750);
  assert.equal(belowMin.valid, false);

  const capped = validateCoupon("WEEKEND15", 2500);
  assert.equal(capped.valid, true);
  assert.equal(capped.discountAmount, 250);
});

test("Invalid coupon codes are gracefully rejected", () => {
  const res = validateCoupon("FAKECODE99", 1000);
  assert.equal(res.valid, false);
  assert.equal(res.discountAmount, 0);
});
