import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Release abandoned seat holds so seats return to the live map
crons.interval("release-expired-seat-locks", { minutes: 1 }, internal.seatLocking.releaseExpiredLocks, {});

// Keep the booking horizon (next 14 days) populated from operator schedules
crons.interval("generate-upcoming-trips", { hours: 1 }, internal.schedules.generateAll, {});

// Close out trips that have arrived
crons.interval("complete-finished-trips", { minutes: 30 }, internal.schedules.completeFinishedTrips, {});

// Purge expired sessions and OTPs
crons.interval("purge-expired-sessions", { hours: 6 }, internal.maintenance.purgeExpired, {});

export default crons;
