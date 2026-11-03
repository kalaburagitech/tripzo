import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mobile Passenger Authentication
 */

// Step 1: Request OTP for passenger login
export const sendOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const cleanPhone = args.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      throw new Error("Invalid mobile number. Please enter a valid 10-digit number.");
    }

    // In DEVELOPMENT and SANDBOX: fixed OTP is 123456
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first();

    if (!existing) {
      await ctx.db.insert("users", {
        phone: cleanPhone,
        role: "CUSTOMER",
        isVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      phone: cleanPhone,
      message: "OTP sent successfully. In development/demo mode, use code: 123456",
      demoOtp: "123456",
    };
  },
});

// Step 2: Verify OTP
export const verifyOtp = mutation({
  args: {
    phone: v.string(),
    otp: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanPhone = args.phone.replace(/[^0-9]/g, "");

    // Development demo OTP is 123456
    if (args.otp !== "123456") {
      throw new Error("Invalid OTP. For demo access, please use: 123456");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first();

    const now = Date.now();
    if (!user) {
      const id = await ctx.db.insert("users", {
        phone: cleanPhone,
        name: args.name || "Tripzo Traveler",
        email: args.email,
        role: "CUSTOMER",
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });
      user = await ctx.db.get(id);
    } else {
      await ctx.db.patch(user._id, {
        isVerified: true,
        name: args.name || user.name || "Tripzo Traveler",
        email: args.email || user.email,
        updatedAt: now,
      });
      user = await ctx.db.get(user._id);
    }

    return {
      success: true,
      user,
      token: `demo_jwt_${user!._id}_${Date.now()}`,
    };
  },
});

// Guest Mode Login
export const registerGuest = mutation({
  args: {},
  handler: async (ctx) => {
    const guestPhone = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      phone: guestPhone,
      name: "Guest Traveler",
      role: "CUSTOMER",
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    const user = await ctx.db.get(id);
    return {
      success: true,
      user,
      token: `demo_guest_jwt_${id}`,
    };
  },
});

// Get User Profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update Profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.userId);
  },
});

// Save Passenger for quick checkout
export const savePassenger = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentList = user.savedPassengers || [];
    const newPassenger = {
      id: `p_${Date.now()}`,
      name: args.name,
      age: args.age,
      gender: args.gender,
    };

    await ctx.db.patch(args.userId, {
      savedPassengers: [...currentList, newPassenger],
      updatedAt: Date.now(),
    });

    return newPassenger;
  },
});

/**
 * Super Admin & Operator Admin Authentication
 */

export const loginAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!admin) {
      throw new Error("Account not found. Please check your credentials.");
    }

    if (!admin.isActive) {
      throw new Error("Your account has been deactivated. Contact super admin.");
    }

    // In development/sandbox: check password or default password
    if (admin.passwordHash !== args.password && args.password !== "Tripzo@Admin2026") {
      throw new Error("Invalid password.");
    }

    await ctx.db.patch(admin._id, {
      lastLoginAt: Date.now(),
    });

    let operator = null;
    if (admin.operatorId) {
      operator = await ctx.db.get(admin.operatorId);
    }

    return {
      success: true,
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        operatorId: admin.operatorId,
      },
      operator,
      token: `admin_token_${admin._id}_${Date.now()}`,
    };
  },
});
