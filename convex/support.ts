import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Passenger Support Tickets & FAQ Engine
 */

export const createSupportTicket = mutation({
  args: {
    userId: v.string(),
    bookingId: v.optional(v.id("bookings")),
    subject: v.string(),
    category: v.union(
      v.literal("BOOKING"),
      v.literal("CANCELLATION"),
      v.literal("REFUND"),
      v.literal("BUS_QUALITY"),
      v.literal("OTHER")
    ),
    message: v.string(),
    senderName: v.string(),
  },
  handler: async (ctx, args) => {
    const ticketRandom = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${ticketRandom}`;
    const now = Date.now();

    const ticketId = await ctx.db.insert("supportTickets", {
      ticketNumber,
      userId: args.userId,
      bookingId: args.bookingId,
      subject: args.subject,
      category: args.category,
      status: "OPEN",
      priority: "MEDIUM",
      messages: [
        {
          sender: "USER",
          senderName: args.senderName,
          text: args.message,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return { ticketId, ticketNumber };
  },
});

export const addTicketMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    sender: v.union(v.literal("USER"), v.literal("AGENT")),
    senderName: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      messages: [
        ...ticket.messages,
        {
          sender: args.sender,
          senderName: args.senderName,
          text: args.text,
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

export const getUserTickets = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
