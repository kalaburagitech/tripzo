const test = require("node:test");
const assert = require("node:assert/strict");

function calculateRefund(totalAmount, hoursBeforeDeparture) {
  let refundPercent = 0;
  if (hoursBeforeDeparture >= 24) {
    refundPercent = 90;
  } else if (hoursBeforeDeparture >= 12) {
    refundPercent = 50;
  } else {
    refundPercent = 0;
  }

  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const cancellationFee = totalAmount - refundAmount;

  return {
    refundPercent,
    refundAmount,
    cancellationFee,
  };
}

test("Cancellation > 24h before departure gives 90% refund", () => {
  const res = calculateRefund(1200, 30);
  assert.equal(res.refundPercent, 90);
  assert.equal(res.refundAmount, 1080);
  assert.equal(res.cancellationFee, 120);
});

test("Cancellation 12-24h before departure gives 50% refund", () => {
  const res = calculateRefund(1200, 16);
  assert.equal(res.refundPercent, 50);
  assert.equal(res.refundAmount, 600);
  assert.equal(res.cancellationFee, 600);
});

test("Cancellation < 12h before departure gives 0% refund", () => {
  const res = calculateRefund(1200, 3);
  assert.equal(res.refundPercent, 0);
  assert.equal(res.refundAmount, 0);
  assert.equal(res.cancellationFee, 1200);
});
