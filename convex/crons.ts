import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const expireOldLocksJob = internalMutation({
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
      .take(50);

    for (const seat of expiredSeats) {
      await ctx.db.patch(seat._id, {
        status: "AVAILABLE",
        lockedByUserId: undefined,
        lockExpiresAt: undefined,
        version: seat.version + 1,
      });
    }
  },
});

const crons = cronJobs();

// Run every 2 minutes to clean up expired passenger seat locks
crons.interval(
  "clean-expired-seat-locks",
  { minutes: 2 },
  internal.crons.expireOldLocksJob
);

export default crons;
