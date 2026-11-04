const test = require("node:test");
const assert = require("node:assert/strict");

function calculateBookingBreakdown({
  seats,
  seatPrice,
  discountAmount = 0,
  commissionRate = 10.0,
}) {
  const baseFare = seats.length * seatPrice;
  const convenienceFee = 49;
  const taxableAmount = Math.max(0, baseFare - discountAmount);
  const gst = Math.round(taxableAmount * 0.05); // 5% GST
  const totalAmount = taxableAmount + convenienceFee + gst;

  // Platform Commission & Operator Share
  const commissionAmount = Math.round((baseFare * commissionRate) / 100);
  const operatorShare = totalAmount - commissionAmount - convenienceFee;

  return {
    baseFare,
    discountAmount,
    convenienceFee,
    gst,
    totalAmount,
    commissionAmount,
    operatorShare,
  };
}

test("Single seat booking without discount splits correctly", () => {
  const res = calculateBookingBreakdown({
    seats: ["L1"],
    seatPrice: 1000,
    discountAmount: 0,
    commissionRate: 10.0,
  });

  assert.equal(res.baseFare, 1000);
  assert.equal(res.convenienceFee, 49);
  assert.equal(res.gst, 50); // 5% of 1000
  assert.equal(res.totalAmount, 1099); // 1000 + 49 + 50
  assert.equal(res.commissionAmount, 100); // 10% of 1000
  assert.equal(res.operatorShare, 950); // 1099 - 100 - 49 = 950
});

test("Multi-seat booking with discount applies commission on base fare", () => {
  const res = calculateBookingBreakdown({
    seats: ["L1", "L2", "U1"],
    seatPrice: 1200,
    discountAmount: 150,
    commissionRate: 10.0,
  });

  assert.equal(res.baseFare, 3600); // 3 * 1200
  assert.equal(res.commissionAmount, 360); // 10% of 3600
  assert.equal(res.gst, Math.round((3600 - 150) * 0.05)); // 5% of 3450 = 173
  assert.equal(res.totalAmount, 3450 + 49 + 173); // 3672
  assert.equal(res.operatorShare, res.totalAmount - 360 - 49);
});
