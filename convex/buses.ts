import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { requireAdmin, requireLiveOperator, requireOperatorAccess, isOperatorLive } from "./lib/auth";
import { addMinutesToTime, istDateString, isValidDate, isValidTime, parseDurationToMinutes } from "./lib/time";
import { createTripWithSeats, notifyTripPassengers, tripDepartureAt } from "./lib/trips";
import { cancelBookingCore } from "./bookings";

/**
 * Fleet, Routes, Trips (operator side) and public trip search.
 */

const busTypeV = v.union(
  v.literal("AC Sleeper (2+1)"),
  v.literal("AC Seater / Sleeper"),
  v.literal("Volvo Multi-Axle AC"),
  v.literal("Scania Multi-Axle Sleeper"),
  v.literal("BharatBenz AC Sleeper"),
  v.literal("Non-AC Seater / Sleeper")
);
const categoryV = v.union(v.literal("sleeper"), v.literal("seater"), v.literal("semi-sleeper"));

// ───────────────────────── Fleet ─────────────────────────

export const createBus = mutation({
  args: {
    token: v.optional(v.string()),
    operatorId: v.optional(v.id("operators")),
    busNumber: v.string(),
    name: v.string(),
    busType: busTypeV,
    category: categoryV,
    isAc: v.boolean(),
    totalSeats: v.number(),
    hasUpperDeck: v.boolean(),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    requireLiveOperator(operator);

    const busNumber = args.busNumber.trim().toUpperCase();
    if (!busNumber || !args.name.trim()) throw new Error("Bus number and name are required.");
    if (args.totalSeats < 10 || args.totalSeats > 60) throw new Error("Seat count must be between 10 and 60.");
    const dupe = await ctx.db
      .query("buses")
      .withIndex("by_busNumber", (q) => q.eq("busNumber", busNumber))
      .first();
    if (dupe) throw new Error(`A bus with registration ${busNumber} already exists.`);

    const now = Date.now();
    const busId = await ctx.db.insert("buses", {
      operatorId: operator._id,
      busNumber,
      name: args.name.trim(),
      busType: args.busType,
      category: args.category,
      isAc: args.isAc,
      totalSeats: Math.round(args.totalSeats),
      hasUpperDeck: args.hasUpperDeck,
      amenities: args.amenities,
      images: args.images.filter((u) => /^https?:\/\//.test(u)),
      rating: 4.5,
      reviewCount: 0,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(operator._id, { totalBuses: (operator.totalBuses || 0) + 1, updatedAt: now });
    return busId;
  },
});

export const updateBusStatus = mutation({
  args: {
    token: v.optional(v.string()),
    busId: v.id("buses"),
    status: v.union(v.literal("ACTIVE"), v.literal("MAINTENANCE"), v.literal("INACTIVE")),
  },
  handler: async (ctx, args) => {
    const bus = await ctx.db.get(args.busId);
    if (!bus) throw new Error("Bus not found");
    await requireOperatorAccess(ctx, args.token, bus.operatorId);
    await ctx.db.patch(bus._id, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const listOperatorBuses = query({
  args: { token: v.optional(v.string()), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    return await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();
  },
});

export const listAllBuses = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const buses = await ctx.db.query("buses").collect();
    const operators = await ctx.db.query("operators").collect();
    const opMap = new Map(operators.map((o) => [o._id, o.companyName]));
    return buses.map((b) => ({ ...b, operatorName: opMap.get(b.operatorId) || "Operator" }));
  },
});

// ───────────────────────── Routes ─────────────────────────

const stopInputV = v.object({
  name: v.string(),
  landmark: v.optional(v.string()),
  offsetMinutes: v.number(),
});

export const createRouteWithStops = mutation({
  args: {
    token: v.optional(v.string()),
    operatorId: v.optional(v.id("operators")),
    fromCity: v.string(),
    toCity: v.string(),
    distanceKm: v.number(),
    typicalDurationHours: v.number(),
    basePrice: v.number(),
    boardingStops: v.array(stopInputV),
    droppingStops: v.array(stopInputV),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    requireLiveOperator(operator);
    const fromCity = args.fromCity.trim();
    const toCity = args.toCity.trim();
    if (!fromCity || !toCity || fromCity.toLowerCase() === toCity.toLowerCase()) {
      throw new Error("Origin and destination must be two different cities.");
    }
    if (args.boardingStops.length === 0 || args.droppingStops.length === 0) {
      throw new Error("Add at least one boarding point and one dropping point.");
    }
    if (args.basePrice <= 0 || args.typicalDurationHours <= 0) {
      throw new Error("Fare and duration must be greater than zero.");
    }

    const now = Date.now();
    const routeId = await ctx.db.insert("routes", {
      operatorId: operator._id,
      fromCity,
      toCity,
      distanceKm: args.distanceKm,
      typicalDurationHours: args.typicalDurationHours,
      basePrice: args.basePrice,
      isActive: true,
      createdAt: now,
    });
    const insertStops = async (stops: typeof args.boardingStops, type: "BOARDING" | "DROPPING", city: string) => {
      for (let i = 0; i < stops.length; i++) {
        if (!stops[i].name.trim()) continue;
        await ctx.db.insert("routeStops", {
          routeId,
          operatorId: operator._id,
          type,
          stopName: stops[i].name.trim(),
          landmark: stops[i].landmark?.trim() || undefined,
          city,
          offsetMinutes: Math.max(0, Math.round(stops[i].offsetMinutes)),
          orderIndex: i + 1,
        });
      }
    };
    await insertStops(args.boardingStops, "BOARDING", fromCity);
    await insertStops(args.droppingStops, "DROPPING", toCity);
    return routeId;
  },
});

export const listOperatorRoutes = query({
  args: { token: v.optional(v.string()), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();
    return await Promise.all(
      routes.map(async (r) => ({
        ...r,
        stops: await ctx.db
          .query("routeStops")
          .withIndex("by_routeId", (q) => q.eq("routeId", r._id))
          .collect(),
      }))
    );
  },
});

export const listRoutes = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("routes").collect();
  },
});

/** Public: cities that currently have at least one active route. */
export const listServedCities = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    const set = new Set<string>();
    for (const r of routes) {
      set.add(r.fromCity);
      set.add(r.toCity);
    }
    return Array.from(set).sort();
  },
});

// ───────────────────────── Trips (operator) ─────────────────────────

/** One-off trip on a specific date (recurring service lives in schedules.ts). */
export const scheduleTrip = mutation({
  args: {
    token: v.optional(v.string()),
    busId: v.id("buses"),
    routeId: v.id("routes"),
    journeyDate: v.string(),
    departureTime: v.string(),
    duration: v.string(),
    baseFare: v.number(),
  },
  handler: async (ctx, args) => {
    const bus = await ctx.db.get(args.busId);
    const route = await ctx.db.get(args.routeId);
    if (!bus || !route) throw new Error("Bus or route not found");
    const { operator } = await requireOperatorAccess(ctx, args.token, bus.operatorId);
    requireLiveOperator(operator);
    if (route.operatorId !== operator._id) throw new Error("This route belongs to another operator.");
    if (bus.status !== "ACTIVE") throw new Error("This bus is not active.");
    if (!isValidDate(args.journeyDate) || !isValidTime(args.departureTime)) {
      throw new Error("Please provide a valid date (YYYY-MM-DD) and time (HH:MM).");
    }
    if (args.journeyDate < istDateString()) throw new Error("Trips cannot be scheduled in the past.");
    const durationMinutes = parseDurationToMinutes(args.duration);
    if (durationMinutes <= 0) throw new Error("Duration should look like '9h 30m'.");
    if (args.baseFare <= 0) throw new Error("Fare must be greater than zero.");

    return await createTripWithSeats(ctx, {
      operatorId: operator._id,
      bus,
      route,
      journeyDate: args.journeyDate,
      departureTime: args.departureTime,
      durationMinutes,
      baseFare: Math.round(args.baseFare),
    });
  },
});

export const listOperatorTrips = query({
  args: {
    token: v.optional(v.string()),
    operatorId: v.optional(v.id("operators")),
    fromDate: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    const from = args.fromDate || istDateString();
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_operator_and_date", (q) => q.eq("operatorId", operator._id).gte("journeyDate", from))
      .take(500);
    const limitDate = new Date(Date.parse(from) + (args.days ?? 7) * 86_400_000).toISOString().slice(0, 10);
    const buses = new Map<string, Doc<"buses"> | null>();
    const out = [];
    for (const t of trips) {
      if (t.journeyDate > limitDate) continue;
      if (!buses.has(t.busId)) buses.set(t.busId, await ctx.db.get(t.busId));
      const bus = buses.get(t.busId);
      out.push({
        ...t,
        departureAt: tripDepartureAt(t),
        bookedSeats: t.totalSeatsCount - t.availableSeatsCount,
        busNumber: bus?.busNumber || "",
        busName: bus?.name || "",
      });
    }
    out.sort((a, b) => a.departureAt - b.departureAt);
    return out;
  },
});

const STATUS_MESSAGES: Record<string, (t: Doc<"trips">) => [string, string]> = {
  BOARDING: (t) => ["Boarding has started 🚌", `Your ${t.fromCity} → ${t.toCity} bus is now boarding. Please reach your boarding point.`],
  IN_TRANSIT: (t) => ["Your bus has departed", `The ${t.fromCity} → ${t.toCity} bus is on its way. Track it live in the app.`],
  COMPLETED: (t) => ["Trip completed", `Thanks for travelling ${t.fromCity} → ${t.toCity} with Tripzo!`],
};

export const updateTripStatus = mutation({
  args: {
    token: v.optional(v.string()),
    tripId: v.id("trips"),
    liveStatus: v.union(
      v.literal("SCHEDULED"),
      v.literal("BOARDING"),
      v.literal("IN_TRANSIT"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    await requireOperatorAccess(ctx, args.token, trip.operatorId);
    if (trip.liveStatus === "CANCELLED" || trip.liveStatus === "COMPLETED") {
      throw new Error(`This trip is already ${trip.liveStatus.toLowerCase()}.`);
    }

    await ctx.db.patch(trip._id, { liveStatus: args.liveStatus, updatedAt: Date.now() });

    if (args.liveStatus === "CANCELLED") {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_tripId", (q) => q.eq("tripId", trip._id))
        .collect();
      let refunded = 0;
      for (const b of bookings) {
        if (b.bookingStatus !== "CONFIRMED") continue;
        await cancelBookingCore(ctx, b, {
          reason: `Trip cancelled by operator${args.reason ? `: ${args.reason}` : ""}`,
          refundPercentOverride: 100,
        });
        refunded++;
      }
      return { success: true, refundedBookings: refunded };
    }

    const msg = STATUS_MESSAGES[args.liveStatus];
    if (msg) {
      const [title, body] = msg(trip);
      await notifyTripPassengers(ctx, trip._id, title, body);
    }
    return { success: true };
  },
});

/** Conductor / driver location ping (from the operator portal on a phone). */
export const updateTripLocation = mutation({
  args: {
    token: v.optional(v.string()),
    tripId: v.id("trips"),
    latitude: v.number(),
    longitude: v.number(),
    speedKmH: v.optional(v.number()),
    nearestStop: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    await requireOperatorAccess(ctx, args.token, trip.operatorId);
    if (trip.liveStatus === "CANCELLED" || trip.liveStatus === "COMPLETED") {
      throw new Error("Live tracking is closed for this trip.");
    }
    await ctx.db.patch(trip._id, {
      currentLocation: {
        latitude: args.latitude,
        longitude: args.longitude,
        lastUpdatedTime: new Date().toISOString(),
        currentSpeedKmH: Math.max(0, Math.round(args.speedKmH ?? 0)),
        nearestStop: args.nearestStop || trip.currentLocation?.nearestStop || trip.fromCity,
      },
      liveStatus: trip.liveStatus === "SCHEDULED" || trip.liveStatus === "BOARDING" ? "IN_TRANSIT" : trip.liveStatus,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ───────────────────────── Public search ─────────────────────────

function stopsFor(stops: Doc<"routeStops">[], type: "BOARDING" | "DROPPING", departureTime: string) {
  return stops
    .filter((s) => s.type === type)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      id: s._id,
      name: s.stopName,
      landmark: s.landmark,
      time: addMinutesToTime(departureTime, s.offsetMinutes),
      latitude: s.latitude,
      longitude: s.longitude,
    }));
}

function publicOperator(op: Doc<"operators">) {
  return {
    _id: op._id,
    companyName: op.companyName,
    tradeName: op.tradeName,
    logoUrl: op.logoUrl,
    rating: op.rating,
    totalReviews: op.totalReviews,
    phone: op.phone,
  };
}

function tripCard(
  trip: Doc<"trips">,
  operator: Doc<"operators">,
  bus: Doc<"buses">,
  stops: Doc<"routeStops">[]
) {
  return {
    id: trip._id,
    tripId: trip._id,
    operatorId: trip.operatorId,
    operatorName: operator.companyName,
    busName: bus.name,
    busType: bus.busType,
    busCategory: bus.category,
    isAc: bus.isAc,
    hasUpperDeck: bus.hasUpperDeck,
    rating: bus.reviewCount > 0 ? bus.rating : operator.rating,
    reviewCount: bus.reviewCount > 0 ? bus.reviewCount : operator.totalReviews,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    departureAt: tripDepartureAt(trip),
    duration: trip.duration,
    fromCity: trip.fromCity,
    toCity: trip.toCity,
    journeyDate: trip.journeyDate,
    price: trip.baseFare,
    availableSeats: trip.availableSeatsCount,
    totalSeats: trip.totalSeatsCount,
    amenities: bus.amenities,
    boardingPoints: stopsFor(stops, "BOARDING", trip.departureTime),
    droppingPoints: stopsFor(stops, "DROPPING", trip.departureTime),
    images: bus.images,
    cancellationPolicy: trip.cancellationPolicy,
    liveStatus: trip.liveStatus,
  };
}

export const searchTrips = query({
  args: { fromCity: v.string(), toCity: v.string(), journeyDate: v.string() },
  handler: async (ctx, args) => {
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_route_and_date", (q) =>
        q.eq("fromCity", args.fromCity.trim()).eq("toCity", args.toCity.trim()).eq("journeyDate", args.journeyDate)
      )
      .collect();

    const now = Date.now();
    const results = [];
    for (const trip of trips) {
      if (trip.liveStatus !== "SCHEDULED" && trip.liveStatus !== "BOARDING") continue;
      if (tripDepartureAt(trip) < now) continue;
      const operator = await ctx.db.get(trip.operatorId);
      if (!operator || !isOperatorLive(operator)) continue;
      const bus = await ctx.db.get(trip.busId);
      if (!bus || bus.status !== "ACTIVE") continue;
      const stops = await ctx.db
        .query("routeStops")
        .withIndex("by_routeId", (q) => q.eq("routeId", trip.routeId))
        .collect();
      results.push(tripCard(trip, operator, bus, stops));
    }
    results.sort((a, b) => a.departureAt - b.departureAt);
    return results;
  },
});

export const getTripDetails = query({
  args: { tripId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("trips", args.tripId);
    if (!id) return null;
    const trip = await ctx.db.get(id);
    if (!trip) return null;
    const [operator, bus] = await Promise.all([ctx.db.get(trip.operatorId), ctx.db.get(trip.busId)]);
    if (!operator || !bus) return null;
    const stops = await ctx.db
      .query("routeStops")
      .withIndex("by_routeId", (q) => q.eq("routeId", trip.routeId))
      .collect();
    return { ...tripCard(trip, operator, bus, stops), operator: publicOperator(operator), busNumber: bus.busNumber };
  },
});

/** Public live-tracking feed (no passenger data). */
export const getTripLive = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const stops = await ctx.db
      .query("routeStops")
      .withIndex("by_routeId", (q) => q.eq("routeId", trip.routeId))
      .collect();
    const bus = await ctx.db.get(trip.busId);
    return {
      tripId: trip._id,
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      journeyDate: trip.journeyDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      departureAt: tripDepartureAt(trip),
      liveStatus: trip.liveStatus,
      currentLocation: trip.currentLocation ?? null,
      busNumber: bus?.busNumber,
      boardingPoints: stopsFor(stops, "BOARDING", trip.departureTime),
      droppingPoints: stopsFor(stops, "DROPPING", trip.departureTime),
    };
  },
});
