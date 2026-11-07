import { MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { addMinutesToTime, departureEpoch, formatDuration } from "./time";

/**
 * Seat grid convention shared with the mobile seat map:
 *   sleeper 2+1 → cols 0 (single, left) | 2, 3 (double, right)
 *   seater  2+2 → cols 0, 1 (left)      | 3, 4 (right)
 */
type SeatSpec = {
  seatNumber: string;
  seatType: "seater" | "sleeper";
  berth: "lower" | "upper";
  row: number;
  col: number;
  isFemaleReserved: boolean;
};

const SLEEPER_COLS = [0, 2, 3];
const SEATER_COLS = [0, 1, 3, 4];

function deckSeats(
  count: number,
  berth: "lower" | "upper",
  seatType: "seater" | "sleeper",
  prefix: string
): SeatSpec[] {
  const cols = seatType === "sleeper" ? SLEEPER_COLS : SEATER_COLS;
  const seats: SeatSpec[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols.length) + 1;
    const col = cols[i % cols.length];
    seats.push({
      seatNumber: `${prefix}${i + 1}`,
      seatType,
      berth,
      row,
      col,
      // Front-row ladies seats on each deck
      isFemaleReserved: row === 1 && col <= 1,
    });
  }
  return seats;
}

export function seatLayoutForBus(bus: Doc<"buses">): SeatSpec[] {
  const lowerType: "seater" | "sleeper" = bus.category === "sleeper" ? "sleeper" : "seater";
  if (bus.hasUpperDeck) {
    const upperCount = Math.floor(bus.totalSeats / 2);
    const lowerCount = bus.totalSeats - upperCount;
    return [
      ...deckSeats(lowerCount, "lower", lowerType, "L"),
      ...deckSeats(upperCount, "upper", "sleeper", "U"),
    ];
  }
  return deckSeats(bus.totalSeats, "lower", lowerType, lowerType === "sleeper" ? "L" : "S");
}

export async function createTripWithSeats(
  ctx: MutationCtx,
  args: {
    operatorId: Id<"operators">;
    bus: Doc<"buses">;
    route: Doc<"routes">;
    scheduleId?: Id<"recurringSchedules">;
    journeyDate: string;
    departureTime: string;
    durationMinutes: number;
    baseFare: number;
  }
): Promise<Id<"trips">> {
  const now = Date.now();
  const layout = seatLayoutForBus(args.bus);
  const tripId = await ctx.db.insert("trips", {
    scheduleId: args.scheduleId,
    departureAt: departureEpoch(args.journeyDate, args.departureTime),
    operatorId: args.operatorId,
    busId: args.bus._id,
    routeId: args.route._id,
    fromCity: args.route.fromCity,
    toCity: args.route.toCity,
    journeyDate: args.journeyDate,
    departureTime: args.departureTime,
    arrivalTime: addMinutesToTime(args.departureTime, args.durationMinutes),
    duration: formatDuration(args.durationMinutes),
    baseFare: args.baseFare,
    availableSeatsCount: layout.length,
    totalSeatsCount: layout.length,
    liveStatus: "SCHEDULED",
    cancellationPolicy: {
      zeroRefundWindowHours: 4,
      fiftyPercentWindowHours: 12,
      ninetyPercentWindowHours: 24,
    },
    createdAt: now,
    updatedAt: now,
  });

  for (const seat of layout) {
    await ctx.db.insert("tripSeats", {
      tripId,
      ...seat,
      price: args.baseFare,
      status: "AVAILABLE",
      version: 1,
    });
  }
  return tripId;
}

/** Departure epoch for a trip, tolerant of rows created before `departureAt` existed. */
export function tripDepartureAt(trip: Doc<"trips">): number {
  return trip.departureAt ?? departureEpoch(trip.journeyDate, trip.departureTime);
}

/** Recomputes the trip's available count from non-booked seats. */
export async function refreshAvailability(ctx: MutationCtx, tripId: Id<"trips">) {
  const seats = await ctx.db
    .query("tripSeats")
    .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
    .collect();
  await ctx.db.patch(tripId, {
    availableSeatsCount: seats.filter((s) => s.status !== "BOOKED").length,
    totalSeatsCount: seats.length,
    updatedAt: Date.now(),
  });
}

export async function notifyTripPassengers(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  title: string,
  body: string
) {
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
    .collect();
  const now = Date.now();
  for (const b of bookings) {
    if (b.bookingStatus !== "CONFIRMED") continue;
    await ctx.db.insert("notifications", {
      userId: b.userId,
      title,
      body,
      type: "TRIP_UPDATE",
      metadata: JSON.stringify({ bookingId: b._id, tripId }),
      isRead: false,
      createdAt: now,
    });
  }
}
