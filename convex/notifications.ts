import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser, requireUser } from "./lib/auth";

/** In-app passenger notifications (reactive). */

export const listMine = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    if (!user) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const unreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    if (!user) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", false))
      .take(100);
    return unread.length;
  },
});

export const markAllRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", false))
      .take(200);
    for (const n of unread) await ctx.db.patch(n._id, { isRead: true });
    return { updated: unread.length };
  },
});
