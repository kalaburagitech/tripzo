import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser, requireAdmin, requireUser } from "./lib/auth";

/**
 * Passenger support tickets
 */

export const createSupportTicket = mutation({
  args: {
    token: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (!args.message.trim() || !args.subject.trim()) throw new Error("Please describe your issue.");
    if (args.bookingId) {
      const b = await ctx.db.get(args.bookingId);
      if (!b || b.userId !== user._id) throw new Error("Booking not found");
    }
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      ticketNumber,
      userId: user._id,
      bookingId: args.bookingId,
      subject: args.subject.trim(),
      category: args.category,
      status: "OPEN",
      priority: "MEDIUM",
      messages: [
        { sender: "USER", senderName: user.name || "Traveler", text: args.message.trim(), timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    });
    return { ticketId, ticketNumber };
  },
});

export const addTicketMessage = mutation({
  args: { token: v.string(), ticketId: v.id("supportTickets"), text: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (!args.text.trim()) throw new Error("Message cannot be empty.");

    let sender: "USER" | "AGENT";
    let senderName: string;
    const user = await getUser(ctx, args.token);
    if (user) {
      if (ticket.userId !== user._id) throw new Error("Ticket not found");
      sender = "USER";
      senderName = user.name || "Traveler";
    } else {
      const agent = await requireAdmin(ctx, args.token, ["SUPER_ADMIN", "BOOKING_SUPPORT"]);
      sender = "AGENT";
      senderName = agent.name;
    }

    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      messages: [...ticket.messages, { sender, senderName, text: args.text.trim(), timestamp: now }],
      status: sender === "AGENT" && ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const getUserTickets = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    if (!user) return [];
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const listOpenTickets = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token, ["SUPER_ADMIN", "BOOKING_SUPPORT"]);
    const open = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q) => q.eq("status", "OPEN"))
      .order("desc")
      .take(100);
    const progress = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q) => q.eq("status", "IN_PROGRESS"))
      .order("desc")
      .take(100);
    return [...open, ...progress];
  },
});

export const setTicketStatus = mutation({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
    status: v.union(v.literal("OPEN"), v.literal("IN_PROGRESS"), v.literal("RESOLVED"), v.literal("CLOSED")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token, ["SUPER_ADMIN", "BOOKING_SUPPORT"]);
    await ctx.db.patch(args.ticketId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});
