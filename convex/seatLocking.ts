import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes temporary hold

/**
 * Concurrency-Safe Real-time Seat Locking Engine
 */

// 1. Get Live Trip Seat Map with auto-expiration check
export const getTripSeatMap = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const seats = await ctx.db
      .query("tripSeats")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const now = Date.now();

    // Map and sanitize seat status
    const mappedSeats = seats.map((s) => {
      let currentStatus = s.status;
      // If locked but expired, consider available
      if (currentStatus === "LOCKED" && s.lockExpiresAt && s.lockExpiresAt < now) {
        currentStatus = "AVAILABLE";
      }

      return {
        id: s._id,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        berth: s.berth,
        row: s.row,
        col: s.col,
        price: s.price,
        status: currentStatus,
        isFemaleReserved: s.isFemaleReserved,
        lockExpiresAt: s.lockExpiresAt,
        lockedByUserId: s.lockedByUserId,
      };
    });

    const lowerDeck = mappedSeats.filter((s) => s.berth === "lower");
    const upperDeck = mappedSeats.filter((s) => s.berth === "upper");

    return {
      lowerDeck,
      upperDeck,
      totalSeats: mappedSeats.length,
      availableCount: mappedSeats.filter((s) => s.status === "AVAILABLE").length,
    };
  },
});

// 2. Concurrency-Safe Seat Locking Mutation
export const lockSeats = mutation({
  args: {
    tripId: v.id("trips"),
    seatNumbers: v.array(v.string()),
    userId: v.string(), // Customer userId or guest identifier
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    if (args.seatNumbers.length === 0) {
      throw new Error("No seats selected for locking.");
    }
    if (args.seatNumbers.length > 6) {
      throw new Error("Maximum 6 seats can be booked in a single reservation.");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const now = Date.now();
    const expiresAt = now + LOCK_DURATION_MS;

    // Fetch all requested seat records with concurrency check
    const seatDocs = [];
    for (const seatNo of args.seatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) =>
          q.eq("tripId", args.tripId).eq("seatNumber", seatNo)
        )
        .first();

      if (!seat) {
        throw new Error(`Seat ${seatNo} does not exist on this bus.`);
      }

      // Check if already booked
      if (seat.status === "BOOKED") {
        throw new Error(`Seat ${seatNo} has already been booked by another passenger.`);
      }

      // Check if locked by someone else and lock has not expired
      if (
        seat.status === "LOCKED" &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt > now &&
        seat.lockedByUserId !== args.userId
      ) {
        throw new Error(
          `Seat ${seatNo} is currently held by another passenger. Please select a different seat.`
        );
      }

      // Female seat reservation validation:
      if (seat.isFemaleReserved && args.gender && args.gender === "male") {
        throw new Error(`Seat ${seatNo} is reserved for female passengers only.`);
      }

      seatDocs.push(seat);
    }

    // Atomic update of all verified seats
    for (const seat of seatDocs) {
      await ctx.db.patch(seat._id, {
        status: "LOCKED",
        lockedByUserId: args.userId,
        lockExpiresAt: expiresAt,
        bookedByGender: args.gender,
        version: seat.version + 1,
      });
    }

    // Recalculate and update available seat count
    const remainingAvailable = await ctx.db
      .query("tripSeats")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("status"), "AVAILABLE"))
      .collect();

    await ctx.db.patch(args.tripId, {
      availableSeatsCount: Math.max(0, remainingAvailable.length - seatDocs.length),
      updatedAt: now,
    });

    return {
      success: true,
      lockedSeats: args.seatNumbers,
      expiresAt,
      lockDurationSeconds: LOCK_DURATION_MS / 1000,
    };
  },
});

// 3. Unlock Seats (User cancelled or backed out)
export const unlockSeats = mutation({
  args: {
    tripId: v.id("trips"),
    seatNumbers: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const seatNo of args.seatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) =>
          q.eq("tripId", args.tripId).eq("seatNumber", seatNo)
        )
        .first();

      if (seat && seat.status === "LOCKED" && seat.lockedByUserId === args.userId) {
        await ctx.db.patch(seat._id, {
          status: "AVAILABLE",
          lockedByUserId: undefined,
          lockExpiresAt: undefined,
          version: seat.version + 1,
        });
      }
    }

    return { success: true };
  },
});

// 4. Background Job: Release Expired Seat Locks across all trips
export const releaseExpiredLocks = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSeats = await ctx.db
      .query("tripSeats")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "LOCKED"),
          q.neq(q.field("lockExpiresAt"), undefined),
          q.lt(q.field("lockExpiresAt"), now)
        )
      )
      .take(100);

    let releasedCount = 0;
    const affectedTripIds = new Set<string>();

    for (const seat of expiredSeats) {
      await ctx.db.patch(seat._id, {
        status: "AVAILABLE",
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });
      affectedTripIds.add(seat.tripId);
      releasedCount++;
    }

    return { releasedCount, affectedTrips: affectedTripIds.size };
  },
});
