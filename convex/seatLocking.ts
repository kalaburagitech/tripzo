import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser, requireUser } from "./lib/auth";
import { tripDepartureAt } from "./lib/trips";

export const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minute hold

const genderV = v.union(v.literal("male"), v.literal("female"), v.literal("other"));

/**
 * Live seat map. Reactive: clients subscribed with useQuery see other
 * passengers' holds and bookings the moment they happen.
 */
export const getTripSeatMap = query({
  args: { tripId: v.id("trips"), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const viewer = await getUser(ctx, args.token);
    const viewerId = viewer?._id;

    const seats = await ctx.db
      .query("tripSeats")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const now = Date.now();
    const mapped = seats.map((s) => {
      let status: "AVAILABLE" | "LOCKED" | "BOOKED" = s.status;
      if (status === "LOCKED" && (!s.lockExpiresAt || s.lockExpiresAt < now)) status = "AVAILABLE";
      const isMine = status === "LOCKED" && !!viewerId && s.lockedByUserId === viewerId;
      return {
        id: s._id,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        berth: s.berth,
        row: s.row,
        col: s.col,
        price: s.price,
        status,
        isMine,
        isFemaleReserved: s.isFemaleReserved,
        bookedByGender: status === "BOOKED" ? s.bookedByGender : undefined,
        lockExpiresAt: isMine ? s.lockExpiresAt : undefined,
      };
    });

    return {
      tripStatus: trip.liveStatus,
      lowerDeck: mapped.filter((s) => s.berth === "lower"),
      upperDeck: mapped.filter((s) => s.berth === "upper"),
      totalSeats: mapped.length,
      availableCount: mapped.filter((s) => s.status === "AVAILABLE").length,
    };
  },
});

/**
 * Hold seats for the signed-in passenger. Replaces any previous hold this
 * passenger had on the same trip, so the hold always equals the selection.
 */
export const lockSeats = mutation({
  args: {
    token: v.string(),
    tripId: v.id("trips"),
    seatNumbers: v.array(v.string()),
    gender: v.optional(genderV),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const userId = user._id;
    const wanted = Array.from(new Set(args.seatNumbers));
    if (wanted.length === 0) throw new Error("No seats selected.");
    if (wanted.length > 6) throw new Error("Maximum 6 seats can be booked in a single reservation.");

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.liveStatus !== "SCHEDULED" && trip.liveStatus !== "BOARDING") {
      throw new Error("This trip is no longer open for booking.");
    }
    if (tripDepartureAt(trip) < Date.now()) {
      throw new Error("This bus has already departed.");
    }

    const now = Date.now();
    const expiresAt = now + LOCK_DURATION_MS;
    const seats = await ctx.db
      .query("tripSeats")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();
    const byNumber = new Map(seats.map((s) => [s.seatNumber, s]));

    // Validate everything before writing anything (mutation is atomic anyway).
    for (const seatNo of wanted) {
      const seat = byNumber.get(seatNo);
      if (!seat) throw new Error(`Seat ${seatNo} does not exist on this bus.`);
      if (seat.status === "BOOKED") throw new Error(`Seat ${seatNo} was just booked by another passenger.`);
      if (
        seat.status === "LOCKED" &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt > now &&
        seat.lockedByUserId !== userId
      ) {
        throw new Error(`Seat ${seatNo} is being booked by another passenger. Please pick another seat.`);
      }
      if (seat.isFemaleReserved && args.gender === "male") {
        throw new Error(`Seat ${seatNo} is reserved for female passengers.`);
      }
    }

    // Release this passenger's holds that are no longer selected.
    for (const seat of seats) {
      if (seat.status === "LOCKED" && seat.lockedByUserId === userId && !wanted.includes(seat.seatNumber)) {
        await ctx.db.patch(seat._id, {
          status: "AVAILABLE",
          lockedByUserId: undefined,
          lockExpiresAt: undefined,
          version: seat.version + 1,
        });
      }
    }

    for (const seatNo of wanted) {
      const seat = byNumber.get(seatNo)!;
      await ctx.db.patch(seat._id, {
        status: "LOCKED",
        lockedByUserId: userId,
        lockExpiresAt: expiresAt,
        version: seat.version + 1,
      });
    }

    return {
      success: true,
      lockedSeats: wanted,
      expiresAt,
      lockDurationSeconds: LOCK_DURATION_MS / 1000,
    };
  },
});

export const unlockSeats = mutation({
  args: { token: v.string(), tripId: v.id("trips"), seatNumbers: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const seats = await ctx.db
      .query("tripSeats")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const seat of seats) {
      if (
        seat.status === "LOCKED" &&
        seat.lockedByUserId === user._id &&
        (!args.seatNumbers || args.seatNumbers.includes(seat.seatNumber))
      ) {
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

/** Cron: release abandoned holds. */
export const releaseExpiredLocks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("tripSeats")
      .withIndex("by_status_and_expiry", (q) => q.eq("status", "LOCKED").lt("lockExpiresAt", now))
      .take(500);
    for (const seat of expired) {
      await ctx.db.patch(seat._id, {
        status: "AVAILABLE",
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });
    }
    return { releasedCount: expired.length };
  },
});
