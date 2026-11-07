import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import {
  createSession,
  deleteSession,
  getAdmin,
  getUser,
  hashPassword,
  requireUser,
  sha256,
  verifyPassword,
} from "./lib/auth";

/**
 * Passenger (OTP) and portal (email + password) authentication.
 *
 * OTP delivery: until an SMS gateway is configured, the platform runs in demo
 * mode and the code is DEMO_OTP (default 123456). Set OTP_DEMO_MODE=false on
 * the deployment once an SMS provider is wired in.
 */

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const genderV = v.union(v.literal("male"), v.literal("female"), v.literal("other"));

function demoMode() {
  return process.env.OTP_DEMO_MODE !== "false";
}

function cleanPhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function publicProfile(user: Doc<"users">) {
  return {
    id: user._id,
    name: user.name || "Tripzo Traveler",
    phone: user.isGuest ? "" : user.phone,
    email: user.email || "",
    gender: user.gender,
    age: user.age,
    isGuest: !!user.isGuest,
    avatarUrl: user.avatarUrl,
    savedPassengers: user.savedPassengers || [],
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

// Step 1: Request OTP
export const sendOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = cleanPhone(args.phone);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("otpCodes")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (existing && now - existing.createdAt < OTP_RESEND_COOLDOWN_MS) {
      throw new Error("Please wait 30 seconds before requesting another OTP.");
    }
    if (existing) await ctx.db.delete(existing._id);

    if (!demoMode()) {
      throw new Error("SMS delivery is not configured on this deployment yet.");
    }
    const code = process.env.DEMO_OTP || "123456";

    await ctx.db.insert("otpCodes", {
      phone,
      codeHash: await sha256(`${phone}:${code}`),
      attempts: 0,
      expiresAt: now + OTP_TTL_MS,
      createdAt: now,
    });

    return {
      success: true,
      phone,
      demoMode: true,
      message: `OTP sent. Demo mode is on, use ${code}.`,
      demoOtp: code,
    };
  },
});

// Step 2: Verify OTP → session
export const verifyOtp = mutation({
  args: {
    phone: v.string(),
    otp: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    gender: v.optional(genderV),
  },
  handler: async (ctx, args) => {
    const phone = cleanPhone(args.phone);
    const now = Date.now();
    const record = await ctx.db
      .query("otpCodes")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (!record || record.expiresAt < now) {
      throw new Error("OTP expired. Please request a new one.");
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await ctx.db.delete(record._id);
      throw new Error("Too many incorrect attempts. Please request a new OTP.");
    }
    if ((await sha256(`${phone}:${args.otp.trim()}`)) !== record.codeHash) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      throw new Error("Incorrect OTP. Please try again.");
    }
    await ctx.db.delete(record._id);

    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (!user) {
      const id = await ctx.db.insert("users", {
        phone,
        name: args.name?.trim() || "Tripzo Traveler",
        email: args.email?.trim() || undefined,
        gender: args.gender,
        role: "CUSTOMER",
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });
      user = (await ctx.db.get(id))!;
    } else {
      await ctx.db.patch(user._id, {
        isVerified: true,
        name: args.name?.trim() || user.name || "Tripzo Traveler",
        email: args.email?.trim() || user.email,
        gender: args.gender || user.gender,
        updatedAt: now,
      });
      user = (await ctx.db.get(user._id))!;
    }

    const token = await createSession(ctx, "USER", user._id);
    return { success: true, token, user: publicProfile(user) };
  },
});

// Guest mode: a real (unverified) account so bookings still belong to someone
export const registerGuest = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      phone: `guest_${now}_${Math.floor(Math.random() * 1e6)}`,
      name: "Guest Traveler",
      role: "CUSTOMER",
      isVerified: false,
      isGuest: true,
      createdAt: now,
      updatedAt: now,
    });
    const token = await createSession(ctx, "USER", id);
    return { success: true, token, user: publicProfile((await ctx.db.get(id))!) };
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, args.token);
    return user ? publicProfile(user) : null;
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await deleteSession(ctx, args.token);
    return { success: true };
  },
});

export const updateUserProfile = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    gender: v.optional(genderV),
    age: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const { token: _t, ...fields } = args;
    const patch: Partial<Doc<"users">> = { updatedAt: Date.now() };
    if (fields.name !== undefined) patch.name = fields.name.trim();
    if (fields.email !== undefined) patch.email = fields.email.trim() || undefined;
    if (fields.gender !== undefined) patch.gender = fields.gender;
    if (fields.age !== undefined) patch.age = fields.age;
    if (fields.avatarUrl !== undefined) patch.avatarUrl = fields.avatarUrl;
    await ctx.db.patch(user._id, patch);
    return publicProfile((await ctx.db.get(user._id))!);
  },
});

export const savePassenger = mutation({
  args: { token: v.string(), name: v.string(), age: v.number(), gender: genderV },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (!args.name.trim() || args.age < 1 || args.age > 120) {
      throw new Error("Please provide a valid passenger name and age.");
    }
    const list = user.savedPassengers || [];
    if (list.length >= 20) throw new Error("You can save up to 20 co-travellers.");
    const p = { id: `p_${Date.now()}`, name: args.name.trim(), age: args.age, gender: args.gender };
    await ctx.db.patch(user._id, { savedPassengers: [...list, p], updatedAt: Date.now() });
    return p;
  },
});

export const deletePassenger = mutation({
  args: { token: v.string(), passengerId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    await ctx.db.patch(user._id, {
      savedPassengers: (user.savedPassengers || []).filter((p) => p.id !== args.passengerId),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Super Admin & Operator portal authentication
 */
export const loginAdmin = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();

    const invalid = "Invalid email or password.";
    if (!admin) throw new Error(invalid);

    const { ok, needsUpgrade } = await verifyPassword(args.password, admin.passwordHash);
    if (!ok) throw new Error(invalid);
    if (!admin.isActive) throw new Error("Your account has been deactivated. Contact Tripzo support.");

    await ctx.db.patch(admin._id, {
      lastLoginAt: Date.now(),
      ...(needsUpgrade ? { passwordHash: await hashPassword(args.password) } : {}),
    });

    const operator = admin.operatorId ? await ctx.db.get(admin.operatorId) : null;
    const token = await createSession(ctx, "ADMIN", admin._id);

    return {
      success: true,
      token,
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        operatorId: admin.operatorId,
      },
      operator: operator
        ? { _id: operator._id, companyName: operator.companyName, status: operator.status }
        : null,
    };
  },
});

export const adminMe = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const admin = await getAdmin(ctx, args.token);
    if (!admin) return null;
    const operator = admin.operatorId ? await ctx.db.get(admin.operatorId) : null;
    return {
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        operatorId: admin.operatorId,
      },
      operator: operator
        ? {
            _id: operator._id,
            companyName: operator.companyName,
            status: operator.status,
            rejectionReason: operator.rejectionReason,
            commissionRate: operator.commissionRate,
          }
        : null,
    };
  },
});

export const logoutAdmin = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await deleteSession(ctx, args.token);
    return { success: true };
  },
});

export const changeAdminPassword = mutation({
  args: { token: v.string(), currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const admin = await getAdmin(ctx, args.token);
    if (!admin) throw new Error("Session expired. Please sign in again.");
    const { ok } = await verifyPassword(args.currentPassword, admin.passwordHash);
    if (!ok) throw new Error("Current password is incorrect.");
    if (args.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
    await ctx.db.patch(admin._id, { passwordHash: await hashPassword(args.newPassword) });
    return { success: true };
  },
});
