import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireLiveOperator, requireOperatorAccess, isOperatorLive } from "./lib/auth";
import { addDays, dayOfWeek, istDateString, isValidTime, parseDurationToMinutes } from "./lib/time";
import { createTripWithSeats, tripDepartureAt } from "./lib/trips";

/**
 * Recurring service timetables. Operators define a schedule once
 * (bus + route + departure time + days of week) and the platform keeps the
 * next BOOKING_HORIZON_DAYS of trips published automatically.
 */
export const BOOKING_HORIZON_DAYS = 14;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const createSchedule = mutation({
  args: {
    token: v.string(),
    busId: v.id("buses"),
    routeId: v.id("routes"),
    departureTime: v.string(),
    duration: v.string(), // "9h 30m"
    baseFare: v.number(),
    daysOfWeek: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const bus = await ctx.db.get(args.busId);
    const route = await ctx.db.get(args.routeId);
    if (!bus || !route) throw new Error("Bus or route not found");
    const { operator } = await requireOperatorAccess(ctx, args.token, bus.operatorId);
    requireLiveOperator(operator);
    if (route.operatorId !== operator._id) throw new Error("This route belongs to another operator.");
    if (!isValidTime(args.departureTime)) throw new Error("Departure time must be HH:MM (24-hour).");
    const durationMinutes = parseDurationToMinutes(args.duration);
    if (durationMinutes <= 0 || durationMinutes > 48 * 60) throw new Error("Duration should look like '9h 30m'.");
    if (args.baseFare <= 0) throw new Error("Fare must be greater than zero.");
    const days = Array.from(new Set(args.daysOfWeek ?? ALL_DAYS)).filter((d) => d >= 0 && d <= 6);
    if (days.length === 0) throw new Error("Pick at least one day of the week.");

    const now = Date.now();
    const scheduleId = await ctx.db.insert("recurringSchedules", {
      operatorId: operator._id,
      busId: bus._id,
      routeId: route._id,
      departureTime: args.departureTime,
      durationMinutes,
      baseFare: Math.round(args.baseFare),
      daysOfWeek: days.sort(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.schedules.generateForSchedule, { scheduleId });
    return scheduleId;
  },
});

export const setScheduleActive = mutation({
  args: { token: v.string(), scheduleId: v.id("recurringSchedules"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await requireOperatorAccess(ctx, args.token, schedule.operatorId);
    await ctx.db.patch(schedule._id, { isActive: args.isActive, updatedAt: Date.now() });
    if (args.isActive) {
      await ctx.scheduler.runAfter(0, internal.schedules.generateForSchedule, { scheduleId: schedule._id });
    }
    return { success: true };
  },
});

export const updateScheduleFare = mutation({
  args: { token: v.string(), scheduleId: v.id("recurringSchedules"), baseFare: v.number() },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await requireOperatorAccess(ctx, args.token, schedule.operatorId);
    if (args.baseFare <= 0) throw new Error("Fare must be greater than zero.");
    await ctx.db.patch(schedule._id, { baseFare: Math.round(args.baseFare), updatedAt: Date.now() });
    return { success: true };
  },
});

export const listSchedules = query({
  args: { token: v.string(), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    const schedules = await ctx.db
      .query("recurringSchedules")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();
    return await Promise.all(
      schedules.map(async (s) => {
        const [bus, route] = await Promise.all([ctx.db.get(s.busId), ctx.db.get(s.routeId)]);
        return {
          ...s,
          busNumber: bus?.busNumber || "",
          busName: bus?.name || "",
          fromCity: route?.fromCity || "",
          toCity: route?.toCity || "",
        };
      })
    );
  },
});

/** Ensures trips exist for the booking horizon for one schedule. Idempotent. */
export const generateForSchedule = internalMutation({
  args: { scheduleId: v.id("recurringSchedules") },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule || !schedule.isActive) return { created: 0 };
    const [operator, bus, route] = await Promise.all([
      ctx.db.get(schedule.operatorId),
      ctx.db.get(schedule.busId),
      ctx.db.get(schedule.routeId),
    ]);
    if (!operator || !isOperatorLive(operator) || !bus || bus.status !== "ACTIVE" || !route || !route.isActive) {
      return { created: 0 };
    }

    const today = istDateString();
    let created = 0;
    for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
      const date = addDays(today, i);
      if (!schedule.daysOfWeek.includes(dayOfWeek(date))) continue;
      const exists = await ctx.db
        .query("trips")
        .withIndex("by_schedule_and_date", (q) => q.eq("scheduleId", schedule._id).eq("journeyDate", date))
        .first();
      if (exists) continue;
      await createTripWithSeats(ctx, {
        operatorId: operator._id,
        bus,
        route,
        scheduleId: schedule._id,
        journeyDate: date,
        departureTime: schedule.departureTime,
        durationMinutes: schedule.durationMinutes,
        baseFare: schedule.baseFare,
      });
      created++;
    }
    return { created };
  },
});

/** Cron entry point: fan out one job per active schedule (keeps each transaction small). */
export const generateAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db
      .query("recurringSchedules")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    for (const s of schedules) {
      await ctx.scheduler.runAfter(0, internal.schedules.generateForSchedule, { scheduleId: s._id });
    }
    return { scheduled: schedules.length };
  },
});

/** Cron: roll past trips forward to COMPLETED so dashboards and passenger history stay accurate. */
export const completeFinishedTrips = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let completed = 0;
    for (const status of ["SCHEDULED", "BOARDING", "IN_TRANSIT"] as const) {
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_liveStatus", (q) => q.eq("liveStatus", status))
        .take(1000);
      for (const t of trips) {
        const durationMs = parseDurationToMinutes(t.duration) * 60_000;
        // Two hours of grace after scheduled arrival
        if (tripDepartureAt(t) + durationMs + 2 * 3_600_000 < now) {
          await ctx.db.patch(t._id, { liveStatus: "COMPLETED", updatedAt: now });
          completed++;
        }
      }
    }
    return { completed };
  },
});

/**
 * One-time migration: turn each seeded one-off trip into a daily schedule so
 * the marketplace always has inventory. Safe to re-run.
 */
export const backfillSchedulesFromTrips = internalMutation({
  args: {},
  handler: async (ctx) => {
    const trips = await ctx.db.query("trips").collect();
    const existing = await ctx.db.query("recurringSchedules").collect();
    const key = (busId: string, routeId: string, time: string) => `${busId}|${routeId}|${time}`;
    const seen = new Set(existing.map((s) => key(s.busId, s.routeId, s.departureTime)));
    const now = Date.now();
    let created = 0;
    for (const t of trips) {
      if (t.scheduleId) continue;
      const k = key(t.busId, t.routeId, t.departureTime);
      if (seen.has(k)) continue;
      seen.add(k);
      const route = await ctx.db.get(t.routeId);
      const durationMinutes =
        parseDurationToMinutes(t.duration) || Math.round((route?.typicalDurationHours ?? 8) * 60);
      await ctx.db.insert("recurringSchedules", {
        operatorId: t.operatorId,
        busId: t.busId,
        routeId: t.routeId,
        departureTime: t.departureTime,
        durationMinutes,
        baseFare: t.baseFare,
        daysOfWeek: ALL_DAYS,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
    await ctx.scheduler.runAfter(0, internal.schedules.generateAll, {});
    return { created };
  },
});
