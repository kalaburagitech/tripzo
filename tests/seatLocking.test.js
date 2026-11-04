const test = require("node:test");
const assert = require("node:assert/strict");

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

class SeatLockEngine {
  constructor(initialSeats) {
    this.seats = new Map(initialSeats.map((s) => [s.seatNumber, { ...s, version: 1 }]));
  }

  lockSeats(seatNumbers, userId, gender = "male") {
    if (!seatNumbers || seatNumbers.length === 0) {
      throw new Error("No seats selected");
    }
    if (seatNumbers.length > 6) {
      throw new Error("Maximum 6 seats per booking");
    }

    const now = Date.now();
    const toLock = [];

    for (const seatNo of seatNumbers) {
      const seat = this.seats.get(seatNo);
      if (!seat) throw new Error(`Seat ${seatNo} not found`);

      if (seat.status === "BOOKED") {
        throw new Error(`Seat ${seatNo} is already booked`);
      }

      // Check if locked and unexpired by someone else
      if (
        seat.status === "LOCKED" &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt > now &&
        seat.lockedByUserId !== userId
      ) {
        throw new Error(`Seat ${seatNo} is currently locked by another user`);
      }

      // Female seat check
      if (seat.isFemaleReserved && gender === "male") {
        throw new Error(`Seat ${seatNo} is reserved for female passengers`);
      }

      toLock.push(seat);
    }

    // Atomic update
    for (const seat of toLock) {
      seat.status = "LOCKED";
      seat.lockedByUserId = userId;
      seat.lockExpiresAt = now + LOCK_DURATION_MS;
      seat.version += 1;
    }

    return {
      success: true,
      lockedSeats: seatNumbers,
      expiresAt: now + LOCK_DURATION_MS,
    };
  }

  releaseExpiredLocks(currentTime = Date.now()) {
    let count = 0;
    for (const seat of this.seats.values()) {
      if (seat.status === "LOCKED" && seat.lockExpiresAt && seat.lockExpiresAt <= currentTime) {
        seat.status = "AVAILABLE";
        seat.lockedByUserId = null;
        seat.lockExpiresAt = null;
        seat.version += 1;
        count++;
      }
    }
    return count;
  }
}

test("Enforces maximum 6 seats limit per booking", () => {
  const engine = new SeatLockEngine([
    { seatNumber: "L1", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L2", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L3", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L4", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L5", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L6", status: "AVAILABLE", isFemaleReserved: false },
    { seatNumber: "L7", status: "AVAILABLE", isFemaleReserved: false },
  ]);

  assert.throws(() => {
    engine.lockSeats(["L1", "L2", "L3", "L4", "L5", "L6", "L7"], "user_1");
  }, /Maximum 6 seats per booking/);
});

test("Prevents two users from locking the same seat (concurrency check)", () => {
  const engine = new SeatLockEngine([
    { seatNumber: "L1", status: "AVAILABLE", isFemaleReserved: false },
  ]);

  // User 1 locks seat
  const lock1 = engine.lockSeats(["L1"], "user_1");
  assert.equal(lock1.success, true);

  // User 2 tries to lock the same seat -> must fail
  assert.throws(() => {
    engine.lockSeats(["L1"], "user_2");
  }, /Seat L1 is currently locked by another user/);
});

test("Automatically releases expired seat locks", () => {
  const engine = new SeatLockEngine([
    { seatNumber: "L1", status: "AVAILABLE", isFemaleReserved: false },
  ]);

  const startTime = Date.now();
  engine.lockSeats(["L1"], "user_1");
  assert.equal(engine.seats.get("L1").status, "LOCKED");

  // 5 minutes later: still locked
  const releasedEarly = engine.releaseExpiredLocks(startTime + 5 * 60 * 1000);
  assert.equal(releasedEarly, 0);
  assert.equal(engine.seats.get("L1").status, "LOCKED");

  // 11 minutes later: expired, resets to AVAILABLE
  const releasedAfter = engine.releaseExpiredLocks(startTime + 11 * 60 * 1000);
  assert.equal(releasedAfter, 1);
  assert.equal(engine.seats.get("L1").status, "AVAILABLE");
});

test("Blocks male passengers from locking female reserved seats", () => {
  const engine = new SeatLockEngine([
    { seatNumber: "L1", status: "AVAILABLE", isFemaleReserved: true },
  ]);

  // Male booking attempt fails
  assert.throws(() => {
    engine.lockSeats(["L1"], "user_male", "male");
  }, /reserved for female passengers/);

  // Female booking attempt succeeds
  const lockFemale = engine.lockSeats(["L1"], "user_female", "female");
  assert.equal(lockFemale.success, true);
});
