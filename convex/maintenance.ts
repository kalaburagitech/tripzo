import { internalMutation } from "./_generated/server";

export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(500);
    for (const s of sessions) await ctx.db.delete(s._id);
    const otps = await ctx.db.query("otpCodes").take(1000);
    let otpDeleted = 0;
    for (const o of otps) {
      if (o.expiresAt < now) {
        await ctx.db.delete(o._id);
        otpDeleted++;
      }
    }
    return { sessions: sessions.length, otps: otpDeleted };
  },
});
