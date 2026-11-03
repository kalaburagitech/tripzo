import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Bus Company Registration and Lifecycle Management
 */

// 1. Bus Company Self-Registration
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
    businessType: v.union(
      v.literal("PROPRIETORSHIP"),
      v.literal("PARTNERSHIP"),
      v.literal("PRIVATE_LIMITED"),
      v.literal("PUBLIC_LIMITED"),
      v.literal("LLP")
    ),
    description: v.optional(v.string()),
    password: v.string(),
    // Settlement Account details
    accountHolderName: v.string(),
    accountNumber: v.string(),
    ifscCode: v.string(),
    bankName: v.string(),
    branchName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if operator already registered
    const existing = await ctx.db
      .query("operators")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("An operator company with this email is already registered.");
    }

    const now = Date.now();

    // Create operator entity in PENDING status
    const operatorId = await ctx.db.insert("operators", {
      companyName: args.companyName,
      tradeName: args.tradeName || args.companyName,
      contactPerson: args.contactPerson,
      phone: args.phone,
      email: args.email.toLowerCase(),
      officeAddress: args.officeAddress,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      gstin: args.gstin,
      pan: args.pan,
      businessType: args.businessType,
      description: args.description,
      status: "PENDING",
      commissionRate: 10.0, // Default 10% platform commission
      rating: 4.5,
      totalReviews: 0,
      totalBuses: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create Bank Account record
    await ctx.db.insert("operatorBankAccounts", {
      operatorId,
      accountHolderName: args.accountHolderName,
      accountNumber: args.accountNumber,
      ifscCode: args.ifscCode.toUpperCase(),
      bankName: args.bankName,
      branchName: args.branchName,
      isVerified: false,
      pennyDropStatus: "NOT_INITIATED",
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create Operator Admin User login
    await ctx.db.insert("adminUsers", {
      email: args.email.toLowerCase(),
      passwordHash: args.password,
      name: args.contactPerson,
      role: "OPERATOR_ADMIN",
      operatorId,
      isActive: true,
      createdAt: now,
    });

    // Log Audit Trail
    await ctx.db.insert("auditLogs", {
      actorType: "OPERATOR",
      actorId: operatorId,
      action: "OPERATOR_REGISTERED",
      targetEntity: "operators",
      targetId: operatorId,
      metadata: JSON.stringify({ companyName: args.companyName, email: args.email }),
      timestamp: now,
    });

    return {
      success: true,
      operatorId,
      message: "Registration submitted successfully! Your account is under review by the Tripzo Super Admin.",
    };
  },
});

// 2. Submit Verification Document
export const submitDocument = mutation({
  args: {
    operatorId: v.id("operators"),
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
    const id = await ctx.db.insert("operatorDocuments", {
      operatorId: args.operatorId,
      documentType: args.documentType,
      documentNumber: args.documentNumber,
      fileUrl: args.fileUrl,
      verificationStatus: "PENDING",
      createdAt: Date.now(),
    });
    return id;
  },
});

// 3. Super Admin Review & Approval
export const updateOperatorStatus = mutation({
  args: {
    operatorId: v.id("operators"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("UNDER_REVIEW"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("ACTIVE"),
      v.literal("SUSPENDED")
    ),
    rejectionReason: v.optional(v.string()),
    adminId: v.optional(v.id("adminUsers")),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) throw new Error("Operator not found");

    const now = Date.now();
    await ctx.db.patch(args.operatorId, {
      status: args.status,
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });

    // Log Audit
    await ctx.db.insert("auditLogs", {
      actorType: "ADMIN",
      actorId: args.adminId ? String(args.adminId) : "SUPER_ADMIN",
      action: `OPERATOR_STATUS_${args.status}`,
      targetEntity: "operators",
      targetId: args.operatorId,
      metadata: JSON.stringify({ previousStatus: operator.status, newStatus: args.status }),
      timestamp: now,
    });

    return { success: true, status: args.status };
  },
});

// 4. Update Operator Commission
export const updateOperatorCommission = mutation({
  args: {
    operatorId: v.id("operators"),
    commissionRate: v.number(),
    adminId: v.id("adminUsers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.operatorId, {
      commissionRate: args.commissionRate,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("commissions", {
      operatorId: args.operatorId,
      ratePercent: args.commissionRate,
      effectiveFrom: Date.now(),
      description: `Updated commission rate to ${args.commissionRate}%`,
      createdBy: args.adminId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// 5. Queries
export const listAllOperators = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let operators = await ctx.db.query("operators").collect();
    if (args.status && args.status !== "ALL") {
      operators = operators.filter((o) => o.status === args.status);
    }
    return operators;
  },
});

export const getOperatorDetails = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) return null;

    const documents = await ctx.db
      .query("operatorDocuments")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    const bankAccount = await ctx.db
      .query("operatorBankAccounts")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .first();

    const buses = await ctx.db
      .query("buses")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    return {
      ...operator,
      documents,
      bankAccount,
      buses,
    };
  },
});
