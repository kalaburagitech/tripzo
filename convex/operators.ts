import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { hashPassword, requireAdmin, requireOperatorAccess } from "./lib/auth";

/**
 * Bus company registration, KYC and lifecycle management
 */

const businessTypeV = v.union(
  v.literal("PROPRIETORSHIP"),
  v.literal("PARTNERSHIP"),
  v.literal("PRIVATE_LIMITED"),
  v.literal("PUBLIC_LIMITED"),
  v.literal("LLP")
);

const operatorStatusV = v.union(
  v.literal("PENDING"),
  v.literal("UNDER_REVIEW"),
  v.literal("APPROVED"),
  v.literal("REJECTED"),
  v.literal("ACTIVE"),
  v.literal("SUSPENDED")
);

// 1. Bus company self-registration (public)
export const registerOperator = mutation({
  args: {
    companyName: v.string(),
    tradeName: v.optional(v.string()),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    officeAddress: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    gstin: v.optional(v.string()),
    pan: v.optional(v.string()),
    businessType: businessTypeV,
    description: v.optional(v.string()),
    password: v.string(),
    accountHolderName: v.string(),
    accountNumber: v.string(),
    ifscCode: v.string(),
    bankName: v.string(),
    branchName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid business email.");
    if (args.password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (!args.companyName.trim() || !args.contactPerson.trim()) {
      throw new Error("Company name and contact person are required.");
    }
    const phone = args.phone.replace(/[^0-9]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Please enter a valid 10-digit mobile number.");
    if (!/^\d{6}$/.test(args.pincode.trim())) throw new Error("Pincode must be 6 digits.");
    const ifsc = args.ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) throw new Error("Please enter a valid IFSC code.");
    if (!/^\d{9,18}$/.test(args.accountNumber.trim())) throw new Error("Please enter a valid bank account number.");
    if (args.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(args.pan.trim().toUpperCase())) {
      throw new Error("PAN should look like ABCDE1234F.");
    }

    const existingOp = await ctx.db
      .query("operators")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    const existingLogin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingOp || existingLogin) {
      throw new Error("An account with this email is already registered. Please sign in instead.");
    }

    const now = Date.now();
    const operatorId = await ctx.db.insert("operators", {
      companyName: args.companyName.trim(),
      tradeName: args.tradeName?.trim() || args.companyName.trim(),
      contactPerson: args.contactPerson.trim(),
      phone,
      email,
      officeAddress: args.officeAddress.trim(),
      city: args.city.trim(),
      state: args.state.trim(),
      pincode: args.pincode.trim(),
      gstin: args.gstin?.trim().toUpperCase() || undefined,
      pan: args.pan?.trim().toUpperCase() || undefined,
      businessType: args.businessType,
      description: args.description,
      status: "PENDING",
      commissionRate: Number(process.env.DEFAULT_COMMISSION_PERCENT || 10),
      rating: 4.5,
      totalReviews: 0,
      totalBuses: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("operatorBankAccounts", {
      operatorId,
      accountHolderName: args.accountHolderName.trim(),
      accountNumber: args.accountNumber.trim(),
      ifscCode: ifsc,
      bankName: args.bankName.trim(),
      branchName: args.branchName,
      isVerified: false,
      pennyDropStatus: "NOT_INITIATED",
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("adminUsers", {
      email,
      passwordHash: await hashPassword(args.password),
      name: args.contactPerson.trim(),
      role: "OPERATOR_ADMIN",
      operatorId,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorType: "OPERATOR",
      actorId: operatorId,
      action: "OPERATOR_REGISTERED",
      targetEntity: "operators",
      targetId: operatorId,
      metadata: JSON.stringify({ companyName: args.companyName, email }),
      timestamp: now,
    });

    return {
      success: true,
      operatorId,
      message:
        "Registration submitted! Sign in to the Operator Portal with your email and password. You can publish buses once Tripzo approves your KYC.",
    };
  },
});

// 2. KYC document submission (operator)
export const submitDocument = mutation({
  args: {
    token: v.optional(v.string()),
    documentType: v.union(
      v.literal("PAN_CARD"),
      v.literal("GST_CERTIFICATE"),
      v.literal("BUSINESS_REGISTRATION"),
      v.literal("CANCELLED_CHEQUE"),
      v.literal("OPERATOR_PERMIT"),
      v.literal("INSURANCE_POLICY")
    ),
    documentNumber: v.optional(v.string()),
    fileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token);
    if (!/^https?:\/\//.test(args.fileUrl)) throw new Error("Please provide a valid document link.");
    const id = await ctx.db.insert("operatorDocuments", {
      operatorId: operator._id,
      documentType: args.documentType,
      documentNumber: args.documentNumber,
      fileUrl: args.fileUrl,
      verificationStatus: "PENDING",
      createdAt: Date.now(),
    });
    if (operator.status === "PENDING") {
      await ctx.db.patch(operator._id, { status: "UNDER_REVIEW", updatedAt: Date.now() });
    }
    return id;
  },
});

// 3. Super admin review & approval
export const updateOperatorStatus = mutation({
  args: {
    token: v.optional(v.string()),
    operatorId: v.id("operators"),
    status: operatorStatusV,
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) throw new Error("Operator not found");

    const now = Date.now();
    await ctx.db.patch(args.operatorId, {
      status: args.status,
      rejectionReason: args.status === "REJECTED" ? args.rejectionReason : undefined,
      updatedAt: now,
    });

    // Suspending an operator should also lock its staff out of the portal
    const staff = await ctx.db
      .query("adminUsers")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();
    for (const s of staff) {
      await ctx.db.patch(s._id, { isActive: args.status !== "SUSPENDED" });
    }

    if (args.status === "APPROVED" || args.status === "ACTIVE") {
      const schedules = await ctx.db
        .query("recurringSchedules")
        .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
        .collect();
      for (const s of schedules) {
        await ctx.scheduler.runAfter(0, internal.schedules.generateForSchedule, { scheduleId: s._id });
      }
    }

    await ctx.db.insert("auditLogs", {
      actorType: "ADMIN",
      actorId: admin._id,
      action: `OPERATOR_STATUS_${args.status}`,
      targetEntity: "operators",
      targetId: args.operatorId,
      metadata: JSON.stringify({ previousStatus: operator.status, newStatus: args.status, reason: args.rejectionReason }),
      timestamp: now,
    });

    return { success: true, status: args.status };
  },
});

export const updateOperatorCommission = mutation({
  args: { token: v.optional(v.string()), operatorId: v.id("operators"), commissionRate: v.number() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    if (args.commissionRate < 0 || args.commissionRate > 50) {
      throw new Error("Commission must be between 0% and 50%.");
    }
    const now = Date.now();
    await ctx.db.patch(args.operatorId, { commissionRate: args.commissionRate, updatedAt: now });
    await ctx.db.insert("commissions", {
      operatorId: args.operatorId,
      ratePercent: args.commissionRate,
      effectiveFrom: now,
      description: `Updated commission rate to ${args.commissionRate}%`,
      createdBy: admin._id,
      createdAt: now,
    });
    return { success: true };
  },
});

// 4. Queries
export const listAllOperators = query({
  args: { token: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let operators = await ctx.db.query("operators").order("desc").collect();
    if (args.status && args.status !== "ALL") operators = operators.filter((o) => o.status === args.status);
    return operators;
  },
});

export const getOperatorDetails = query({
  args: { token: v.optional(v.string()), operatorId: v.optional(v.id("operators")) },
  handler: async (ctx, args) => {
    const { operator } = await requireOperatorAccess(ctx, args.token, args.operatorId);
    const documents = await ctx.db
      .query("operatorDocuments")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();
    const bank = await ctx.db
      .query("operatorBankAccounts")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .first();
    const buses = await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
      .collect();
    return {
      ...operator,
      documents,
      bankAccount: bank
        ? {
            ...bank,
            // Never ship full account numbers to the browser
            accountNumber: `XXXX${bank.accountNumber.slice(-4)}`,
          }
        : null,
      buses,
    };
  },
});
