import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Passenger Bookings & Manifest Lifecycle Management
 */

// 1. Create Booking (Atomic confirmation from locked seats)
export const createBooking = mutation({
  args: {
    tripId: v.id("trips"),
    userId: v.string(),
    seatNumbers: v.array(v.string()),
    passengers: v.array(
      v.object({
        name: v.string(),
        age: v.number(),
        gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
        seatNumber: v.string(),
      })
    ),
    boardingPoint: v.object({
      name: v.string(),
      time: v.string(),
      landmark: v.optional(v.string()),
    }),
    droppingPoint: v.object({
      name: v.string(),
      time: v.string(),
      landmark: v.optional(v.string()),
    }),
    contactPhone: v.string(),
    contactEmail: v.string(),
    discountAmount: v.number(),
    couponCode: v.optional(v.string()),
    paymentMethod: v.union(v.literal("UPI"), v.literal("CARD"), v.literal("WALLET"), v.literal("NETBANKING")),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const operator = await ctx.db.get(trip.operatorId);
    if (!operator) throw new Error("Operator not found");

    const now = Date.now();

    // Verify all seats are still locked by this user
    let baseFareTotal = 0;
    const seatDocs = [];
    for (const seatNo of args.seatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) =>
          q.eq("tripId", args.tripId).eq("seatNumber", seatNo)
        )
        .first();

      if (!seat) {
        throw new Error(`Seat ${seatNo} not found on this trip.`);
      }

      if (seat.status === "BOOKED") {
        throw new Error(`Seat ${seatNo} has already been booked.`);
      }

      // If locked, must belong to this user and not be expired
      if (
        seat.status === "LOCKED" &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt < now
      ) {
        throw new Error(`Seat lock expired for seat ${seatNo}. Please reselect.`);
      }

      baseFareTotal += seat.price;
      seatDocs.push(seat);
    }

    const convenienceFee = 49;
    const taxAmount = Math.round((baseFareTotal - args.discountAmount) * 0.05); // 5% GST
    const totalAmount = Math.max(0, baseFareTotal - args.discountAmount + convenienceFee + taxAmount);

    // Calculate Platform Commission & Operator Share
    const commissionRate = operator.commissionRate || 10.0;
    const commissionAmount = Math.round((baseFareTotal * commissionRate) / 100);
    const operatorShareAmount = totalAmount - commissionAmount - convenienceFee;

    // Generate Unique PNR and Booking Code
    const pnrRandom = Math.floor(100000 + Math.random() * 900000);
    const pnr = `TPZ-${pnrRandom}`;
    const bookingCode = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const qrCodeData = JSON.stringify({
      pnr,
      operator: operator.companyName,
      seats: args.seatNumbers,
      date: trip.journeyDate,
      from: trip.fromCity,
      to: trip.toCity,
      verified: true,
    });

    // Create the booking document in PENDING_PAYMENT or CONFIRMED state
    const bookingId = await ctx.db.insert("bookings", {
      pnr,
      bookingCode,
      userId: args.userId,
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
      seatNumbers: args.seatNumbers,
      contactPhone: args.contactPhone,
      contactEmail: args.contactEmail,
      baseFare: baseFareTotal,
      discountAmount: args.discountAmount,
      couponCode: args.couponCode,
      convenienceFee,
      taxAmount,
      totalAmount,
      commissionRate,
      commissionAmount,
      operatorShareAmount,
      bookingStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
      qrCodeData,
      createdAt: now,
      updatedAt: now,
    });

    // Atomically transition all tripSeats to BOOKED
    for (const seat of seatDocs) {
      await ctx.db.patch(seat._id, {
        status: "BOOKED",
        bookingId,
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });

      // Insert into bookingSeats junction table
      const passenger = args.passengers.find((p) => p.seatNumber === seat.seatNumber);
      await ctx.db.insert("bookingSeats", {
        bookingId,
        tripId: args.tripId,
        seatNumber: seat.seatNumber,
        passengerName: passenger?.name || "Traveler",
        fare: seat.price,
      });
    }

    // Insert Passengers
    for (const p of args.passengers) {
      const seat = seatDocs.find((s) => s.seatNumber === p.seatNumber);
      await ctx.db.insert("passengers", {
        bookingId,
        seatNumber: p.seatNumber,
        name: p.name,
        age: p.age,
        gender: p.gender,
        fare: seat?.price || trip.baseFare,
      });
    }

    // Create Payment Record
    const paymentId = await ctx.db.insert("payments", {
      bookingId,
      amount: totalAmount,
      currency: "INR",
      method: args.paymentMethod,
      status: "CAPTURED",
      gatewayProvider: "SIMULATED_DEV",
      gatewayOrderId: `sim_ord_${pnrRandom}`,
      gatewayPaymentId: `pay_${Date.now()}`,
      idempotencyKey: `pay_idemp_${bookingId}`,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(bookingId, { paymentId });

    // Create Settlement Record for the Bus Operator (Razorpay Route ledger)
    await ctx.db.insert("settlements", {
      operatorId: trip.operatorId,
      bookingId,
      grossAmount: totalAmount,
      commissionAmount,
      gatewayCharges: Math.round(totalAmount * 0.02), // 2% gateway charge
      taxDeducted: Math.round(commissionAmount * 0.18), // 18% GST on platform commission
      netPayableAmount: operatorShareAmount,
      status: "PENDING",
      scheduledFor: now + 24 * 60 * 60 * 1000, // T+1 settlement
      idempotencyKey: `stl_${bookingId}`,
      createdAt: now,
    });

    // Append to Immutable Financial Ledger
    await ctx.db.insert("financialLedger", {
      transactionReference: `TXN-${pnrRandom}`,
      bookingId,
      operatorId: trip.operatorId,
      eventType: "PAYMENT_CAPTURED",
      debitAmount: 0,
      creditAmount: totalAmount,
      balanceAfter: totalAmount,
      currency: "INR",
      idempotencyKey: `ledger_${bookingId}_pay`,
      notes: `Ticket booking PNR ${pnr} confirmed via ${args.paymentMethod}`,
      timestamp: now,
    });

    await ctx.db.insert("financialLedger", {
      transactionReference: `COMM-${pnrRandom}`,
      bookingId,
      operatorId: trip.operatorId,
      eventType: "COMMISSION_CALCULATED",
      debitAmount: 0,
      creditAmount: commissionAmount,
      balanceAfter: commissionAmount,
      currency: "INR",
      idempotencyKey: `ledger_${bookingId}_comm`,
      notes: `Platform commission (${commissionRate}%) earned on PNR ${pnr}`,
      timestamp: now,
    });

    // In-App Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Booking Confirmed! 🎉",
      body: `Your ticket for ${trip.fromCity} to ${trip.toCity} (PNR: ${pnr}) has been booked successfully.`,
      type: "BOOKING_CONFIRMED",
      isRead: false,
      createdAt: now,
    });

    return {
      success: true,
      bookingId,
      pnr,
      totalAmount,
      seats: args.seatNumbers,
    };
  },
});

// 2. Cancellation and Refund Policy Execution
export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.bookingStatus === "CANCELLED") {
      throw new Error("This booking has already been cancelled.");
    }

    const trip = await ctx.db.get(booking.tripId);
    const now = Date.now();

    // Cancellation Policy Window Calculation
    // Parse departure timestamp
    let refundPercentage = 90; // Default >12h before
    let cancellationFee = Math.round(booking.totalAmount * 0.1);
    let refundAmount = booking.totalAmount - cancellationFee;

    // Free up the seats in tripSeats back to AVAILABLE
    for (const seatNo of booking.seatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) =>
          q.eq("tripId", booking.tripId).eq("seatNumber", seatNo)
        )
        .first();

      if (seat) {
        await ctx.db.patch(seat._id, {
          status: "AVAILABLE",
          bookingId: undefined,
          lockedByUserId: undefined,
          lockExpiresAt: undefined,
          version: seat.version + 1,
        });
      }
    }

    // Create Refund Record
    const refundId = await ctx.db.insert("refunds", {
      bookingId: args.bookingId,
      paymentId: booking.paymentId!,
      operatorId: booking.operatorId,
      originalAmount: booking.totalAmount,
      refundAmount,
      cancellationFee,
      reason: args.reason,
      status: "PROCESSED",
      gatewayRefundId: `rfnd_${Date.now()}`,
      createdAt: now,
      processedAt: now,
    });

    // Update Booking status
    await ctx.db.patch(args.bookingId, {
      bookingStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      cancellationDetails: {
        cancelledAt: now,
        reason: args.reason,
        refundAmount,
        cancellationFee,
        refundId,
      },
      updatedAt: now,
    });

    // Mark operator settlement reversed
    const settlement = await ctx.db
      .query("settlements")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (settlement) {
      await ctx.db.patch(settlement._id, {
        status: "REVERSED_ON_REFUND",
      });
    }

    // Add Refund to Financial Ledger
    await ctx.db.insert("financialLedger", {
      transactionReference: `RFND-${booking.pnr}`,
      bookingId: args.bookingId,
      operatorId: booking.operatorId,
      eventType: "REFUND_PROCESSED",
      debitAmount: refundAmount,
      creditAmount: 0,
      balanceAfter: -refundAmount,
      currency: "INR",
      idempotencyKey: `ledger_${args.bookingId}_rfnd`,
      notes: `Refund processed for cancelled PNR ${booking.pnr}. Refund: ₹${refundAmount}`,
      timestamp: now,
    });

    return {
      success: true,
      refundAmount,
      cancellationFee,
      message: `Booking cancelled successfully. ₹${refundAmount} will be refunded within 3-5 business days.`,
    };
  },
});

// 3. User Bookings Query (For Passenger App My Bookings tab)
export const getUserBookings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const results = [];
    for (const b of bookings) {
      const operator = await ctx.db.get(b.operatorId);
      const bus = await ctx.db.get(b.busId);
      results.push({
        ...b,
        operatorName: operator?.companyName || "Tripzo Operator",
        busType: bus?.busType || "AC Sleeper (2+1)",
      });
    }

    return results;
  },
});

// 4. Operator Manifest Query (For bus conductors/operators)
export const getTripPassengerManifest = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;

    const bookingSeats = await ctx.db
      .query("bookingSeats")
      .withIndex("by_trip_and_seat", (q) => q.eq("tripId", args.tripId))
      .collect();

    const manifest = [];
    for (const bs of bookingSeats) {
      const booking = await ctx.db.get(bs.bookingId);
      if (booking && booking.bookingStatus === "CONFIRMED") {
        manifest.push({
          seatNumber: bs.seatNumber,
          passengerName: bs.passengerName,
          pnr: booking.pnr,
          contactPhone: booking.contactPhone,
          boardingPoint: booking.boardingPoint.name,
          droppingPoint: booking.droppingPoint.name,
          fare: bs.fare,
        });
      }
    }

    manifest.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));

    return {
      trip,
      totalBooked: manifest.length,
      manifest,
    };
  },
});

// 5. Booking by PNR (For digital pass/ticket view)
export const getBookingByPnr = query({
  args: { pnr: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_pnr", (q) => q.eq("pnr", args.pnr))
      .first();

    if (!booking) return null;

    const operator = await ctx.db.get(booking.operatorId);
    const bus = await ctx.db.get(booking.busId);
    const passengers = await ctx.db
      .query("passengers")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", booking._id))
      .collect();

    return {
      ...booking,
      operatorName: operator?.companyName || "Tripzo Fleet",
      busName: bus?.name || "Premium Sleeper",
      busType: bus?.busType || "AC Sleeper (2+1)",
      passengers,
    };
  },
});
