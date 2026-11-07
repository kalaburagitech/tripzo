import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getUser, requireOperatorAccess, requireUser } from "./lib/auth";
import { couponDiscount, couponRejection, fareBreakdown, refundFor } from "./lib/pricing";
import { istDateString } from "./lib/time";
import { refreshAvailability, tripDepartureAt } from "./lib/trips";

/**
 * Passenger Bookings & Manifest Lifecycle
 */

const genderV = v.union(v.literal("male"), v.literal("female"), v.literal("other"));
const stopV = v.object({ name: v.string(), time: v.string(), landmark: v.optional(v.string()) });

async function resolveCoupon(
  ctx: QueryCtx,
  code: string | undefined,
  amount: number,
  operatorId: Id<"operators">,
  userId?: string
): Promise<{ coupon: Doc<"coupons"> | null; discount: number; message?: string }> {
  if (!code || !code.trim()) return { coupon: null, discount: 0 };
  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
    .first();
  const reason = couponRejection(coupon, amount, operatorId, istDateString());
  if (reason || !coupon) return { coupon: null, discount: 0, message: reason ?? "Invalid coupon." };

  if (userId && coupon.usageLimitPerUser > 0) {
    const mine = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const used = mine.filter((b) => b.couponCode === coupon.code && b.bookingStatus === "CONFIRMED").length;
    if (used >= coupon.usageLimitPerUser) {
      return { coupon: null, discount: 0, message: "You have already used this coupon." };
    }
  }
  return { coupon, discount: couponDiscount(coupon, amount) };
}

async function seatTotal(ctx: QueryCtx, tripId: Id<"trips">, seatNumbers: string[]) {
  let total = 0;
  for (const seatNo of seatNumbers) {
    const seat = await ctx.db
      .query("tripSeats")
      .withIndex("by_trip_and_seat", (q) => q.eq("tripId", tripId).eq("seatNumber", seatNo))
      .first();
    if (!seat) throw new Error(`Seat ${seatNo} not found on this trip.`);
    total += seat.price;
  }
  return total;
}

/** Authoritative price quote shown on the checkout screen. */
export const quoteFare = query({
  args: {
    tripId: v.id("trips"),
    seatNumbers: v.array(v.string()),
    couponCode: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const operator = await ctx.db.get(trip.operatorId);
    const user = await getUser(ctx, args.token);
    const base = await seatTotal(ctx, args.tripId, args.seatNumbers);
    const { coupon, discount, message } = await resolveCoupon(
      ctx,
      args.couponCode,
      base,
      trip.operatorId,
      user?._id
    );
    const fare = fareBreakdown(base, discount, operator?.commissionRate ?? 10);
    return {
      baseFare: fare.baseFare,
      discountAmount: fare.discountAmount,
      convenienceFee: fare.convenienceFee,
      taxAmount: fare.taxAmount,
      totalAmount: fare.totalAmount,
      coupon: coupon ? { code: coupon.code, title: coupon.title } : null,
      couponMessage: args.couponCode
        ? coupon
          ? `Coupon applied! You saved ₹${discount}`
          : message
        : undefined,
    };
  },
});

// 1. Create Booking (confirms seats the passenger is currently holding)
export const createBooking = mutation({
  args: {
    token: v.string(),
    tripId: v.id("trips"),
    seatNumbers: v.array(v.string()),
    passengers: v.array(
      v.object({ name: v.string(), age: v.number(), gender: genderV, seatNumber: v.string() })
    ),
    boardingPoint: stopV,
    droppingPoint: stopV,
    contactPhone: v.string(),
    contactEmail: v.string(),
    couponCode: v.optional(v.string()),
    paymentMethod: v.union(v.literal("UPI"), v.literal("CARD"), v.literal("WALLET"), v.literal("NETBANKING")),
    expectedTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const userId = user._id;
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.liveStatus !== "SCHEDULED" && trip.liveStatus !== "BOARDING") {
      throw new Error("This trip is no longer open for booking.");
    }
    if (tripDepartureAt(trip) < Date.now()) throw new Error("This bus has already departed.");

    const operator = await ctx.db.get(trip.operatorId);
    if (!operator) throw new Error("Operator not found");

    const seatNumbers = Array.from(new Set(args.seatNumbers));
    if (seatNumbers.length === 0 || seatNumbers.length > 6) {
      throw new Error("Select between 1 and 6 seats.");
    }
    if (
      args.passengers.length !== seatNumbers.length ||
      !seatNumbers.every((s) => args.passengers.some((p) => p.seatNumber === s))
    ) {
      throw new Error("Please enter passenger details for every selected seat.");
    }
    for (const p of args.passengers) {
      if (!p.name.trim() || p.age < 1 || p.age > 120) {
        throw new Error(`Please check the name and age for seat ${p.seatNumber}.`);
      }
    }
    const phoneDigits = args.contactPhone.replace(/[^0-9]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) throw new Error("Please enter a valid contact mobile number.");
    if (args.contactEmail && !/^\S+@\S+\.\S+$/.test(args.contactEmail)) {
      throw new Error("Please enter a valid contact email.");
    }

    const now = Date.now();
    const seatDocs: Doc<"tripSeats">[] = [];
    let base = 0;
    for (const seatNo of seatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) => q.eq("tripId", args.tripId).eq("seatNumber", seatNo))
        .first();
      if (!seat) throw new Error(`Seat ${seatNo} not found on this trip.`);
      if (seat.status === "BOOKED") throw new Error(`Seat ${seatNo} has already been booked.`);
      if (
        seat.status !== "LOCKED" ||
        seat.lockedByUserId !== userId ||
        !seat.lockExpiresAt ||
        seat.lockExpiresAt < now
      ) {
        throw new Error(`Your hold on seat ${seatNo} expired. Please select your seats again.`);
      }
      const passenger = args.passengers.find((p) => p.seatNumber === seatNo)!;
      if (seat.isFemaleReserved && passenger.gender !== "female") {
        throw new Error(`Seat ${seatNo} is reserved for a female passenger.`);
      }
      base += seat.price;
      seatDocs.push(seat);
    }

    const { coupon, discount, message } = await resolveCoupon(
      ctx,
      args.couponCode,
      base,
      trip.operatorId,
      userId
    );
    if (args.couponCode && !coupon) throw new Error(message || "Coupon could not be applied.");

    const commissionRate = operator.commissionRate || 10;
    const fare = fareBreakdown(base, discount, commissionRate);
    if (args.expectedTotal !== undefined && args.expectedTotal !== fare.totalAmount) {
      throw new Error(`The fare changed to ₹${fare.totalAmount}. Please review and pay again.`);
    }

    // Unique PNR
    let pnr = "";
    for (let i = 0; i < 5; i++) {
      const candidate = `TPZ-${Math.floor(100000 + Math.random() * 900000)}`;
      const clash = await ctx.db
        .query("bookings")
        .withIndex("by_pnr", (q) => q.eq("pnr", candidate))
        .first();
      if (!clash) {
        pnr = candidate;
        break;
      }
    }
    if (!pnr) throw new Error("Could not allocate a PNR, please retry.");
    const ref = pnr.slice(4);

    const qrCodeData = JSON.stringify({
      pnr,
      operator: operator.companyName,
      seats: seatNumbers,
      date: trip.journeyDate,
      dep: trip.departureTime,
      from: trip.fromCity,
      to: trip.toCity,
      boarding: args.boardingPoint.name,
    });

    const bookingId = await ctx.db.insert("bookings", {
      pnr,
      bookingCode: `BK-${ref}`,
      userId,
      operatorId: trip.operatorId,
      tripId: args.tripId,
      busId: trip.busId,
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      journeyDate: trip.journeyDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      boardingPoint: args.boardingPoint,
      droppingPoint: args.droppingPoint,
      seatNumbers,
      contactPhone: phoneDigits,
      contactEmail: args.contactEmail.trim(),
      baseFare: fare.baseFare,
      discountAmount: fare.discountAmount,
      couponCode: coupon?.code,
      convenienceFee: fare.convenienceFee,
      taxAmount: fare.taxAmount,
      totalAmount: fare.totalAmount,
      commissionRate,
      commissionAmount: fare.commissionAmount,
      operatorShareAmount: fare.operatorShareAmount,
      bookingStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
      qrCodeData,
      createdAt: now,
      updatedAt: now,
    });

    for (const seat of seatDocs) {
      const passenger = args.passengers.find((p) => p.seatNumber === seat.seatNumber)!;
      await ctx.db.patch(seat._id, {
        status: "BOOKED",
        bookingId,
        bookedByGender: passenger.gender,
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });
      await ctx.db.insert("bookingSeats", {
        bookingId,
        tripId: args.tripId,
        seatNumber: seat.seatNumber,
        passengerName: passenger.name.trim(),
        fare: seat.price,
      });
      await ctx.db.insert("passengers", {
        bookingId,
        seatNumber: seat.seatNumber,
        name: passenger.name.trim(),
        age: passenger.age,
        gender: passenger.gender,
        fare: seat.price,
      });
    }
    await refreshAvailability(ctx, args.tripId);

    if (coupon) await ctx.db.patch(coupon._id, { usageCount: coupon.usageCount + 1 });

    const paymentId = await ctx.db.insert("payments", {
      bookingId,
      amount: fare.totalAmount,
      currency: "INR",
      method: args.paymentMethod,
      status: "CAPTURED",
      gatewayProvider: "SIMULATED_DEV",
      gatewayOrderId: `sim_ord_${ref}`,
      gatewayPaymentId: `pay_sim_${now}`,
      idempotencyKey: `pay_idemp_${bookingId}`,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(bookingId, { paymentId });

    await ctx.db.insert("settlements", {
      operatorId: trip.operatorId,
      bookingId,
      grossAmount: fare.totalAmount,
      commissionAmount: fare.commissionAmount,
      gatewayCharges: Math.round(fare.totalAmount * 0.02),
      taxDeducted: Math.round(fare.commissionAmount * 0.18),
      netPayableAmount: fare.operatorShareAmount,
      status: "PENDING",
      scheduledFor: now + 24 * 60 * 60 * 1000,
      idempotencyKey: `stl_${bookingId}`,
      createdAt: now,
    });

    await ctx.db.insert("financialLedger", {
      transactionReference: `TXN-${ref}`,
      bookingId,
      operatorId: trip.operatorId,
      eventType: "PAYMENT_CAPTURED",
      debitAmount: 0,
      creditAmount: fare.totalAmount,
      balanceAfter: fare.totalAmount,
      currency: "INR",
      idempotencyKey: `ledger_${bookingId}_pay`,
      notes: `Ticket booking PNR ${pnr} confirmed via ${args.paymentMethod}`,
      timestamp: now,
    });
    await ctx.db.insert("financialLedger", {
      transactionReference: `COMM-${ref}`,
      bookingId,
      operatorId: trip.operatorId,
      eventType: "COMMISSION_CALCULATED",
      debitAmount: 0,
      creditAmount: fare.commissionAmount,
      balanceAfter: fare.commissionAmount,
      currency: "INR",
      idempotencyKey: `ledger_${bookingId}_comm`,
      notes: `Platform commission (${commissionRate}%) earned on PNR ${pnr}`,
      timestamp: now,
    });

    await ctx.db.insert("notifications", {
      userId,
      title: "Booking Confirmed! 🎉",
      body: `Your ticket for ${trip.fromCity} → ${trip.toCity} on ${trip.journeyDate} (PNR ${pnr}) is confirmed. Seats: ${seatNumbers.join(", ")}.`,
      type: "BOOKING_CONFIRMED",
      metadata: JSON.stringify({ bookingId }),
      isRead: false,
      createdAt: now,
    });

    return { success: true, bookingId, pnr, totalAmount: fare.totalAmount, seats: seatNumbers };
  },
});

/** Shared cancellation used by passengers and by operator trip cancellation. */
export async function cancelBookingCore(
  ctx: MutationCtx,
  booking: Doc<"bookings">,
  opts: { reason: string; refundPercentOverride?: number }
) {
  const trip = await ctx.db.get(booking.tripId);
  const now = Date.now();

  let refundPercent: number;
  let refundAmount: number;
  let cancellationFee: number;
  if (opts.refundPercentOverride !== undefined) {
    refundPercent = opts.refundPercentOverride;
    refundAmount = Math.round((booking.totalAmount * refundPercent) / 100);
    cancellationFee = booking.totalAmount - refundAmount;
  } else {
    const hours = trip ? (tripDepartureAt(trip) - now) / 3_600_000 : 0;
    const policy = trip?.cancellationPolicy ?? { ninetyPercentWindowHours: 24, fiftyPercentWindowHours: 12 };
    ({ refundPercent, refundAmount, cancellationFee } = refundFor(booking.totalAmount, hours, policy));
  }

  for (const seatNo of booking.seatNumbers) {
    const seat = await ctx.db
      .query("tripSeats")
      .withIndex("by_trip_and_seat", (q) => q.eq("tripId", booking.tripId).eq("seatNumber", seatNo))
      .first();
    if (seat && seat.bookingId === booking._id) {
      await ctx.db.patch(seat._id, {
        status: "AVAILABLE",
        bookingId: undefined,
        bookedByGender: undefined,
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });
    }
  }
  if (trip) await refreshAvailability(ctx, trip._id);

  let refundId: Id<"refunds"> | undefined;
  if (booking.paymentId) {
    refundId = await ctx.db.insert("refunds", {
      bookingId: booking._id,
      paymentId: booking.paymentId,
      operatorId: booking.operatorId,
      originalAmount: booking.totalAmount,
      refundAmount,
      cancellationFee,
      reason: opts.reason,
      status: "PROCESSED",
      gatewayRefundId: `rfnd_sim_${now}`,
      createdAt: now,
      processedAt: now,
    });
  }

  await ctx.db.patch(booking._id, {
    bookingStatus: "CANCELLED",
    paymentStatus: refundAmount > 0 ? "REFUNDED" : booking.paymentStatus,
    cancellationDetails: {
      cancelledAt: now,
      reason: opts.reason,
      refundAmount,
      cancellationFee,
      refundId,
    },
    updatedAt: now,
  });

  const settlement = await ctx.db
    .query("settlements")
    .withIndex("by_bookingId", (q) => q.eq("bookingId", booking._id))
    .first();
  if (settlement && settlement.status === "PENDING") {
    await ctx.db.patch(settlement._id, { status: "REVERSED_ON_REFUND" });
  }

  await ctx.db.insert("financialLedger", {
    transactionReference: `RFND-${booking.pnr}`,
    bookingId: booking._id,
    operatorId: booking.operatorId,
    eventType: "REFUND_PROCESSED",
    debitAmount: refundAmount,
    creditAmount: 0,
    balanceAfter: -refundAmount,
    currency: "INR",
    idempotencyKey: `ledger_${booking._id}_rfnd`,
    notes: `Refund (${refundPercent}%) for cancelled PNR ${booking.pnr}: ₹${refundAmount}. Reason: ${opts.reason}`,
    timestamp: now,
  });

  await ctx.db.insert("notifications", {
    userId: booking.userId,
    title: "Booking Cancelled",
    body:
      refundAmount > 0
        ? `PNR ${booking.pnr} was cancelled. ₹${refundAmount} will be refunded within 3-5 business days.`
        : `PNR ${booking.pnr} was cancelled. No refund applies under the cancellation policy.`,
    type: "CANCELLATION",
    metadata: JSON.stringify({ bookingId: booking._id }),
    isRead: false,
    createdAt: now,
  });

  return { refundPercent, refundAmount, cancellationFee };
}

// 2. Passenger cancellation
export const cancelBooking = mutation({
  args: { token: v.string(), bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== user._id) throw new Error("Booking not found");
    if (booking.bookingStatus === "CANCELLED") throw new Error("This booking is already cancelled.");
    const trip = await ctx.db.get(booking.tripId);
    if (trip && (tripDepartureAt(trip) < Date.now() || trip.liveStatus === "IN_TRANSIT" || trip.liveStatus === "COMPLETED")) {
      throw new Error("This journey has already started and can no longer be cancelled.");
    }
    const res = await cancelBookingCore(ctx, booking, { reason: args.reason || "Cancelled by passenger" });
    return {
      success: true,
      ...res,
      message:
        res.refundAmount > 0
          ? `Booking cancelled. ₹${res.refundAmount} (${res.refundPercent}%) will be refunded within 3-5 business days.`
          : "Booking cancelled. No refund applies this close to departure.",
    };
  },
});

/** Refund the passenger would get if they cancelled right now. */
export const cancellationQuote = query({
  args: { token: v.string(), bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    const booking = await ctx.db.get(args.bookingId);
    if (!user || !booking || booking.userId !== user._id) return null;
    const trip = await ctx.db.get(booking.tripId);
    if (!trip) return null;
    const hours = (tripDepartureAt(trip) - Date.now()) / 3_600_000;
    return { hoursToDeparture: hours, ...refundFor(booking.totalAmount, hours, trip.cancellationPolicy) };
  },
});

async function enrichBooking(ctx: QueryCtx, b: Doc<"bookings">) {
  const [operator, bus, trip] = await Promise.all([
    ctx.db.get(b.operatorId),
    ctx.db.get(b.busId),
    ctx.db.get(b.tripId),
  ]);
  const passengers = await ctx.db
    .query("passengers")
    .withIndex("by_bookingId", (q) => q.eq("bookingId", b._id))
    .collect();
  const payment = b.paymentId ? await ctx.db.get(b.paymentId) : null;
  return {
    ...b,
    operatorName: operator?.companyName || "Tripzo Operator",
    operatorPhone: operator?.phone,
    operatorRating: operator?.rating,
    busName: bus?.name || "",
    busNumber: bus?.busNumber || "",
    busType: bus?.busType || "AC Sleeper (2+1)",
    busCategory: bus?.category || "sleeper",
    isAc: bus?.isAc ?? true,
    amenities: bus?.amenities || [],
    paymentMethod: payment?.method || "UPI",
    gatewayPaymentId: payment?.gatewayPaymentId || "",
    tripLiveStatus: trip?.liveStatus || "SCHEDULED",
    departureAt: trip ? tripDepartureAt(trip) : undefined,
    duration: trip?.duration || "",
    passengers: passengers.map((p) => ({
      id: p._id,
      seatNumber: p.seatNumber,
      name: p.name,
      age: p.age,
      gender: p.gender,
    })),
  };
}

// 3. My bookings (reactive)
export const getMyBookings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    if (!user) return [];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
    return await Promise.all(bookings.map((b) => enrichBooking(ctx, b)));
  },
});

export const getMyBooking = query({
  args: { token: v.string(), bookingId: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    if (!user) return null;
    const id = ctx.db.normalizeId("bookings", args.bookingId);
    let booking = id ? await ctx.db.get(id) : null;
    if (!booking) {
      booking = await ctx.db
        .query("bookings")
        .withIndex("by_pnr", (q) => q.eq("pnr", args.bookingId))
        .first();
    }
    if (!booking || booking.userId !== user._id) return null;
    return await enrichBooking(ctx, booking);
  },
});

// 4. Operator passenger manifest
export const getTripPassengerManifest = query({
  args: { token: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    await requireOperatorAccess(ctx, args.token, trip.operatorId);

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const manifest = [];
    for (const b of bookings) {
      if (b.bookingStatus !== "CONFIRMED") continue;
      const passengers = await ctx.db
        .query("passengers")
        .withIndex("by_bookingId", (q) => q.eq("bookingId", b._id))
        .collect();
      for (const p of passengers) {
        manifest.push({
          seatNumber: p.seatNumber,
          passengerName: p.name,
          age: p.age,
          gender: p.gender,
          pnr: b.pnr,
          contactPhone: b.contactPhone,
          boardingPoint: b.boardingPoint.name,
          droppingPoint: b.droppingPoint.name,
          fare: p.fare,
        });
      }
    }
    manifest.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));
    return { trip, totalBooked: manifest.length, manifest };
  },
});
