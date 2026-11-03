import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fleet, Routes & Scheduled Trips Management
 */

// 1. Bus Management
export const createBus = mutation({
  args: {
    operatorId: v.id("operators"),
    busNumber: v.string(),
    name: v.string(),
    busType: v.union(
      v.literal("AC Sleeper (2+1)"),
      v.literal("AC Seater / Sleeper"),
      v.literal("Volvo Multi-Axle AC"),
      v.literal("Scania Multi-Axle Sleeper"),
      v.literal("BharatBenz AC Sleeper"),
      v.literal("Non-AC Seater / Sleeper")
    ),
    category: v.union(v.literal("sleeper"), v.literal("seater"), v.literal("semi-sleeper")),
    isAc: v.boolean(),
    totalSeats: v.number(),
    hasUpperDeck: v.boolean(),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) throw new Error("Operator not found");
    if (operator.status !== "APPROVED" && operator.status !== "ACTIVE") {
      throw new Error("Only approved operators can register buses in the fleet.");
    }

    const now = Date.now();
    const busId = await ctx.db.insert("buses", {
      ...args,
      rating: 4.6,
      reviewCount: 0,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    // Update operator total buses count
    await ctx.db.patch(args.operatorId, {
      totalBuses: (operator.totalBuses || 0) + 1,
      updatedAt: now,
    });

    return busId;
  },
});

export const listOperatorBuses = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();
  },
});

export const listAllBuses = query({
  args: {},
  handler: async (ctx) => {
    const buses = await ctx.db.query("buses").collect();
    const operators = await ctx.db.query("operators").collect();
    const opMap = new Map(operators.map((o) => [o._id, o.companyName]));

    return buses.map((b) => ({
      ...b,
      operatorName: opMap.get(b.operatorId) || "Operator",
    }));
  },
});

// 2. Routes & Stops
export const createRouteWithStops = mutation({
  args: {
    operatorId: v.id("operators"),
    fromCity: v.string(),
    toCity: v.string(),
    distanceKm: v.number(),
    typicalDurationHours: v.number(),
    basePrice: v.number(),
    boardingStops: v.array(
      v.object({
        name: v.string(),
        landmark: v.optional(v.string()),
        offsetMinutes: v.number(),
      })
    ),
    droppingStops: v.array(
      v.object({
        name: v.string(),
        landmark: v.optional(v.string()),
        offsetMinutes: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const routeId = await ctx.db.insert("routes", {
      operatorId: args.operatorId,
      fromCity: args.fromCity,
      toCity: args.toCity,
      distanceKm: args.distanceKm,
      typicalDurationHours: args.typicalDurationHours,
      basePrice: args.basePrice,
      isActive: true,
      createdAt: now,
    });

    // Insert Boarding Points
    for (let i = 0; i < args.boardingStops.length; i++) {
      const stop = args.boardingStops[i];
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: args.operatorId,
        type: "BOARDING",
        stopName: stop.name,
        landmark: stop.landmark,
        city: args.fromCity,
        offsetMinutes: stop.offsetMinutes,
        orderIndex: i + 1,
      });
    }

    // Insert Dropping Points
    for (let i = 0; i < args.droppingStops.length; i++) {
      const stop = args.droppingStops[i];
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: args.operatorId,
        type: "DROPPING",
        stopName: stop.name,
        landmark: stop.landmark,
        city: args.toCity,
        offsetMinutes: stop.offsetMinutes,
        orderIndex: i + 1,
      });
    }

    return routeId;
  },
});

export const listRoutes = query({
  args: { operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    if (args.operatorId) {
      return await ctx.db
        .query("routes")
        .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId!))
        .collect();
    }
    return await ctx.db.query("routes").collect();
  },
});

// 3. Trip Scheduling & Initializing Real-time Seat Inventory
export const scheduleTrip = mutation({
  args: {
    operatorId: v.id("operators"),
    busId: v.id("buses"),
    routeId: v.id("routes"),
    journeyDate: v.string(), // "YYYY-MM-DD"
    departureTime: v.string(), // "21:30"
    arrivalTime: v.string(), // "06:00"
    duration: v.string(), // "8h 30m"
    baseFare: v.number(),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operatorId);
    if (!operator || (operator.status !== "APPROVED" && operator.status !== "ACTIVE")) {
      throw new Error("Operator is not active to publish trips.");
    }

    const bus = await ctx.db.get(args.busId);
    if (!bus) throw new Error("Bus not found");

    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const now = Date.now();
    const tripId = await ctx.db.insert("trips", {
      operatorId: args.operatorId,
      busId: args.busId,
      routeId: args.routeId,
      fromCity: route.fromCity,
      toCity: route.toCity,
      journeyDate: args.journeyDate,
      departureTime: args.departureTime,
      arrivalTime: args.arrivalTime,
      duration: args.duration,
      baseFare: args.baseFare,
      availableSeatsCount: bus.totalSeats,
      totalSeatsCount: bus.totalSeats,
      liveStatus: "SCHEDULED",
      cancellationPolicy: {
        zeroRefundWindowHours: 4,
        fiftyPercentWindowHours: 12,
        ninetyPercentWindowHours: 24,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Generate Seat Inventory for this trip
    // 36 berths sleeper: 18 Lower (L1-L18) + 18 Upper (U1-U18)
    const isSleeper = bus.category === "sleeper" || bus.hasUpperDeck;
    const totalSeats = bus.totalSeats;
    const seatsPerDeck = bus.hasUpperDeck ? Math.floor(totalSeats / 2) : totalSeats;

    // Lower Deck
    for (let i = 1; i <= seatsPerDeck; i++) {
      const seatNo = `L${i}`;
      const isFemale = i === 1 || i === 2 || i === 7;
      await ctx.db.insert("tripSeats", {
        tripId,
        seatNumber: seatNo,
        seatType: isSleeper ? "sleeper" : "seater",
        berth: "lower",
        row: Math.ceil(i / 3),
        col: ((i - 1) % 3) + 1,
        price: args.baseFare,
        status: "AVAILABLE",
        isFemaleReserved: isFemale,
        version: 1,
      });
    }

    // Upper Deck
    if (bus.hasUpperDeck) {
      for (let i = 1; i <= seatsPerDeck; i++) {
        const seatNo = `U${i}`;
        const isFemale = i === 1 || i === 2;
        await ctx.db.insert("tripSeats", {
          tripId,
          seatNumber: seatNo,
          seatType: "sleeper",
          berth: "upper",
          row: Math.ceil(i / 3),
          col: ((i - 1) % 3) + 1,
          price: args.baseFare + 100, // Upper deck premium or variation
          status: "AVAILABLE",
          isFemaleReserved: isFemale,
          version: 1,
        });
      }
    }

    return tripId;
  },
});

// 4. Passenger Trip Search Query (The Core Marketplace Endpoint)
export const searchTrips = query({
  args: {
    fromCity: v.string(),
    toCity: v.string(),
    journeyDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let trips = await ctx.db
      .query("trips")
      .withIndex("by_route_and_date", (q) =>
        q.eq("fromCity", args.fromCity).eq("toCity", args.toCity)
      )
      .collect();

    // If journeyDate filter is passed, filter by date (or return all upcoming if not specified)
    if (args.journeyDate) {
      trips = trips.filter((t) => t.journeyDate === args.journeyDate);
    }

    // Join operator details, bus details, and boarding/dropping stops
    const results = [];
    for (const trip of trips) {
      const operator = await ctx.db.get(trip.operatorId);
      if (!operator || operator.status !== "ACTIVE" && operator.status !== "APPROVED") continue;

      const bus = await ctx.db.get(trip.busId);
      if (!bus) continue;

      const stops = await ctx.db
        .query("routeStops")
        .withIndex("by_routeId", (q) => q.eq("routeId", trip.routeId))
        .collect();

      const boardingPoints = stops
        .filter((s) => s.type === "BOARDING")
        .map((s) => ({
          name: s.stopName,
          time: trip.departureTime,
          landmark: s.landmark,
        }));

      const droppingPoints = stops
        .filter((s) => s.type === "DROPPING")
        .map((s) => ({
          name: s.stopName,
          time: trip.arrivalTime,
          landmark: s.landmark,
        }));

      results.push({
        id: trip._id,
        tripId: trip._id,
        operatorId: trip.operatorId,
        operatorName: operator.companyName,
        busName: bus.name,
        busType: bus.busType,
        rating: operator.rating,
        reviewCount: operator.totalReviews,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        duration: trip.duration,
        fromCity: trip.fromCity,
        toCity: trip.toCity,
        journeyDate: trip.journeyDate,
        price: trip.baseFare,
        originalPrice: Math.round(trip.baseFare * 1.2),
        availableSeats: trip.availableSeatsCount,
        totalSeats: trip.totalSeatsCount,
        amenities: bus.amenities,
        boardingPoints,
        droppingPoints,
        images: bus.images,
        cancellationPolicy: trip.cancellationPolicy,
        liveStatus: trip.liveStatus,
      });
    }

    return results;
  },
});

// 5. Trip Details Query
export const getTripDetails = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;

    const operator = await ctx.db.get(trip.operatorId);
    const bus = await ctx.db.get(trip.busId);
    const stops = await ctx.db
      .query("routeStops")
      .withIndex("by_routeId", (q) => q.eq("routeId", trip.routeId))
      .collect();

    return {
      trip,
      operator,
      bus,
      boardingPoints: stops.filter((s) => s.type === "BOARDING"),
      droppingPoints: stops.filter((s) => s.type === "DROPPING"),
    };
  },
});
