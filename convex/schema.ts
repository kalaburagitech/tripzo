import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. users - Passenger profiles
  users: defineTable({
    phone: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("CUSTOMER"), v.literal("BOOKING_SUPPORT")),
    isVerified: v.boolean(),
    savedPassengers: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          age: v.number(),
          gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"]),

  // 2. adminUsers - Super admin & staff
  adminUsers: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(v.literal("SUPER_ADMIN"), v.literal("OPERATOR_ADMIN"), v.literal("BOOKING_SUPPORT")),
    operatorId: v.optional(v.id("operators")),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_operatorId", ["operatorId"]),

  // 3. operators - Bus companies
  operators: defineTable({
    companyName: v.string(),
    tradeName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
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
    status: v.union(
      v.literal("PENDING"),
      v.literal("UNDER_REVIEW"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("ACTIVE"),
      v.literal("SUSPENDED")
    ),
    rejectionReason: v.optional(v.string()),
    commissionRate: v.number(), // e.g. 10.0 for 10%
    rating: v.number(), // e.g. 4.6
    totalReviews: v.number(),
    totalBuses: v.number(),
    razorpayAccountId: v.optional(v.string()), // Razorpay Route Linked Account ID
    razorpayAccountStatus: v.optional(
      v.union(v.literal("created"), v.literal("activated"), v.literal("under_review"), v.literal("suspended"))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_razorpayAccountId", ["razorpayAccountId"]),

  // 4. operatorDocuments - KYC & compliance files
  operatorDocuments: defineTable({
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
    storageId: v.optional(v.string()),
    verificationStatus: v.union(v.literal("PENDING"), v.literal("VERIFIED"), v.literal("REJECTED")),
    verifiedBy: v.optional(v.id("adminUsers")),
    verifiedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_verificationStatus", ["verificationStatus"]),

  // 5. operatorBankAccounts - Protected settlement bank accounts
  operatorBankAccounts: defineTable({
    operatorId: v.id("operators"),
    accountHolderName: v.string(),
    accountNumber: v.string(),
    ifscCode: v.string(),
    bankName: v.string(),
    branchName: v.optional(v.string()),
    isVerified: v.boolean(),
    pennyDropStatus: v.optional(v.union(v.literal("SUCCESS"), v.literal("FAILED"), v.literal("NOT_INITIATED"))),
    pennyDropReference: v.optional(v.string()),
    razorpayFundAccountId: v.optional(v.string()),
    isPrimary: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_accountNumber", ["accountNumber"]),

  // 6. buses - Fleet vehicles
  buses: defineTable({
    operatorId: v.id("operators"),
    busNumber: v.string(), // e.g. "KA-01-F-2024"
    name: v.string(), // e.g. "VRL Premium Multi-Axle Sleeper"
    busType: v.union(
      v.literal("AC Sleeper (2+1)"),
      v.literal("AC Seater / Sleeper"),
      v.literal("Volvo Multi-Axle AC"),
      v.literal("Scania Multi-Axle Sleeper"),
      v.literal("BharatBenz AC Sleeper"),
      v.literal("Non-AC Seater / Sleeper")
    ),
    category: v.union(v.literal("sleeper"), v.literal("seater"), v.literal("semi-sleeper")),
    isAc: v.boolean(),
    totalSeats: v.number(),
    hasUpperDeck: v.boolean(),
    layoutId: v.optional(v.id("busLayouts")),
    amenities: v.array(v.string()), // ["WiFi", "Charging Port", "Blanket", "Water Bottle", "Live Tracking", "Emergency Exit"]
    images: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    status: v.union(v.literal("ACTIVE"), v.literal("MAINTENANCE"), v.literal("INACTIVE")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_busNumber", ["busNumber"])
    .index("by_status", ["status"]),

  // 7. busLayouts - Seat map templates
  busLayouts: defineTable({
    operatorId: v.optional(v.id("operators")),
    name: v.string(), // e.g. "2+1 Sleeper 36 Berths"
    totalRows: v.number(),
    totalCols: v.number(),
    hasUpperDeck: v.boolean(),
    seats: v.array(
      v.object({
        seatNumber: v.string(),
        seatType: v.union(v.literal("seater"), v.literal("sleeper")),
        berth: v.union(v.literal("lower"), v.literal("upper")),
        row: v.number(),
        col: v.number(),
        tierPriceMultiplier: v.number(), // 1.0 base, 1.1 for premium front
      })
    ),
    createdAt: v.number(),
  }).index("by_operatorId", ["operatorId"]),

  // 8. cities - Cities covered
  cities: defineTable({
    name: v.string(),
    code: v.string(), // e.g. "BLR"
    state: v.string(),
    popular: v.boolean(),
    latitude: v.number(),
    longitude: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_popular", ["popular"]),

  // 9. routes - Master routes
  routes: defineTable({
    operatorId: v.id("operators"),
    fromCity: v.string(),
    toCity: v.string(),
    distanceKm: v.number(),
    typicalDurationHours: v.number(),
    basePrice: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_origin_destination", ["fromCity", "toCity"])
    .index("by_isActive", ["isActive"]),

  // 10. routeStops - Boarding & dropping points
  routeStops: defineTable({
    routeId: v.id("routes"),
    operatorId: v.id("operators"),
    type: v.union(v.literal("BOARDING"), v.literal("DROPPING")),
    stopName: v.string(),
    landmark: v.optional(v.string()),
    city: v.string(),
    offsetMinutes: v.number(), // minutes from trip start
    orderIndex: v.number(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  })
    .index("by_routeId", ["routeId"])
    .index("by_route_and_type", ["routeId", "type"]),

  // 11. trips - Scheduled journeys
  trips: defineTable({
    operatorId: v.id("operators"),
    busId: v.id("buses"),
    routeId: v.id("routes"),
    fromCity: v.string(),
    toCity: v.string(),
    journeyDate: v.string(), // "YYYY-MM-DD"
    departureTime: v.string(), // "21:30"
    arrivalTime: v.string(), // "06:00"
    duration: v.string(), // "8h 30m"
    baseFare: v.number(),
    availableSeatsCount: v.number(),
    totalSeatsCount: v.number(),
    liveStatus: v.union(
      v.literal("SCHEDULED"),
      v.literal("BOARDING"),
      v.literal("IN_TRANSIT"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    currentLocation: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        lastUpdatedTime: v.string(),
        currentSpeedKmH: v.number(),
        nearestStop: v.string(),
      })
    ),
    cancellationPolicy: v.object({
      zeroRefundWindowHours: v.number(), // e.g. 4 hrs before
      fiftyPercentWindowHours: v.number(), // e.g. 12 hrs before
      ninetyPercentWindowHours: v.number(), // e.g. 24 hrs before
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_route_and_date", ["fromCity", "toCity", "journeyDate"])
    .index("by_busId", ["busId"])
    .index("by_liveStatus", ["liveStatus"]),

  // 12. tripSeats - Real-time seat inventory & locking
  tripSeats: defineTable({
    tripId: v.id("trips"),
    seatNumber: v.string(),
    seatType: v.union(v.literal("seater"), v.literal("sleeper")),
    berth: v.union(v.literal("lower"), v.literal("upper")),
    row: v.number(),
    col: v.number(),
    price: v.number(),
    status: v.union(v.literal("AVAILABLE"), v.literal("LOCKED"), v.literal("BOOKED")),
    lockedByUserId: v.optional(v.string()), // userId or guest phone
    lockExpiresAt: v.optional(v.number()), // epoch ms
    isFemaleReserved: v.boolean(),
    bookedByGender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    bookingId: v.optional(v.id("bookings")),
    version: v.number(), // Optimistic locking concurrency check
  })
    .index("by_tripId", ["tripId"])
    .index("by_trip_and_seat", ["tripId", "seatNumber"])
    .index("by_status_and_expiry", ["status", "lockExpiresAt"]),

  // 13. passengers - Individual travelers under a booking
  passengers: defineTable({
    bookingId: v.id("bookings"),
    seatNumber: v.string(),
    name: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    fare: v.number(),
  }).index("by_bookingId", ["bookingId"]),

  // 14. bookings - Customer orders
  bookings: defineTable({
    pnr: v.string(), // "TPZ-XXXXXX"
    bookingCode: v.string(), // "BK-XXXXXX"
    userId: v.string(),
    operatorId: v.id("operators"),
    tripId: v.id("trips"),
    busId: v.id("buses"),
    fromCity: v.string(),
    toCity: v.string(),
    journeyDate: v.string(),
    departureTime: v.string(),
    arrivalTime: v.string(),
    boardingPoint: v.object({
      name: v.string(),
      time: v.string(),
      landmark: v.optional(v.string()),
    }),
    droppingPoint: v.object({
      name: v.string(),
      time: v.string(),
      landmark: v.optional(v.string()),
    }),
    seatNumbers: v.array(v.string()),
    contactPhone: v.string(),
    contactEmail: v.string(),
    baseFare: v.number(),
    discountAmount: v.number(),
    couponCode: v.optional(v.string()),
    convenienceFee: v.number(),
    taxAmount: v.number(),
    totalAmount: v.number(),
    commissionRate: v.number(),
    commissionAmount: v.number(),
    operatorShareAmount: v.number(),
    bookingStatus: v.union(
      v.literal("PENDING_PAYMENT"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED"),
      v.literal("EXPIRED")
    ),
    paymentStatus: v.union(v.literal("PENDING"), v.literal("SUCCESS"), v.literal("FAILED"), v.literal("REFUNDED")),
    paymentId: v.optional(v.id("payments")),
    qrCodeData: v.string(),
    cancellationDetails: v.optional(
      v.object({
        cancelledAt: v.number(),
        reason: v.string(),
        refundAmount: v.number(),
        cancellationFee: v.number(),
        refundId: v.optional(v.id("refunds")),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pnr", ["pnr"])
    .index("by_userId", ["userId"])
    .index("by_operatorId", ["operatorId"])
    .index("by_tripId", ["tripId"])
    .index("by_bookingStatus", ["bookingStatus"])
    .index("by_paymentStatus", ["paymentStatus"]),

  // 15. bookingSeats - Junction for fast seat-booking queries
  bookingSeats: defineTable({
    bookingId: v.id("bookings"),
    tripId: v.id("trips"),
    seatNumber: v.string(),
    passengerName: v.string(),
    fare: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_trip_and_seat", ["tripId", "seatNumber"]),

  // 16. payments - Payment transactions
  payments: defineTable({
    bookingId: v.id("bookings"),
    amount: v.number(),
    currency: v.string(), // "INR"
    method: v.union(v.literal("UPI"), v.literal("CARD"), v.literal("WALLET"), v.literal("NETBANKING")),
    status: v.union(
      v.literal("INITIATED"),
      v.literal("AUTHORIZED"),
      v.literal("CAPTURED"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),
    gatewayProvider: v.union(v.literal("RAZORPAY"), v.literal("SIMULATED_DEV")),
    gatewayOrderId: v.string(), // "order_xxxx" or "sim_ord_xxxx"
    gatewayPaymentId: v.optional(v.string()), // "pay_xxxx"
    gatewaySignature: v.optional(v.string()),
    upiVpa: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    idempotencyKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_gatewayOrderId", ["gatewayOrderId"])
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_status", ["status"]),

  // 17. paymentAttempts - Raw audit trail of all checkout attempts
  paymentAttempts: defineTable({
    bookingId: v.id("bookings"),
    gatewayOrderId: v.string(),
    attemptNumber: v.number(),
    method: v.string(),
    payload: v.string(),
    responseCode: v.optional(v.string()),
    status: v.string(),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_gatewayOrderId", ["gatewayOrderId"]),

  // 18. commissions - Commission rules & records
  commissions: defineTable({
    operatorId: v.optional(v.id("operators")), // null = global default
    ratePercent: v.number(), // e.g. 10.0
    fixedFee: v.optional(v.number()), // e.g. ₹15 per ticket
    effectiveFrom: v.number(),
    effectiveTo: v.optional(v.number()),
    description: v.string(),
    createdBy: v.id("adminUsers"),
    createdAt: v.number(),
  }).index("by_operatorId", ["operatorId"]),

  // 19. settlements - Marketplace operator payouts (Razorpay Route)
  settlements: defineTable({
    operatorId: v.id("operators"),
    bookingId: v.id("bookings"),
    grossAmount: v.number(),
    commissionAmount: v.number(),
    gatewayCharges: v.number(),
    taxDeducted: v.number(),
    netPayableAmount: v.number(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("TRANSFER_INITIATED"),
      v.literal("PROCESSED"),
      v.literal("FAILED"),
      v.literal("REVERSED_ON_REFUND")
    ),
    razorpayTransferId: v.optional(v.string()), // "trf_xxxx"
    transferError: v.optional(v.string()),
    scheduledFor: v.number(),
    processedAt: v.optional(v.number()),
    idempotencyKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_status", ["status"])
    .index("by_idempotencyKey", ["idempotencyKey"]),

  // 20. refunds - Reversals & cancellations
  refunds: defineTable({
    bookingId: v.id("bookings"),
    paymentId: v.id("payments"),
    operatorId: v.id("operators"),
    originalAmount: v.number(),
    refundAmount: v.number(),
    cancellationFee: v.number(),
    reason: v.string(),
    status: v.union(v.literal("INITIATED"), v.literal("PROCESSED"), v.literal("FAILED")),
    gatewayRefundId: v.optional(v.string()), // "rfnd_xxxx"
    reversalSettlementId: v.optional(v.id("settlements")),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_operatorId", ["operatorId"])
    .index("by_status", ["status"]),

  // 21. coupons - Promotional discounts
  coupons: defineTable({
    code: v.string(), // "TRIPZO10", "WELCOME100", "WEEKEND15"
    title: v.string(),
    description: v.string(),
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FLAT")),
    discountValue: v.number(), // 10 or 100
    maxDiscount: v.optional(v.number()),
    minBookingAmount: v.number(),
    validUntil: v.string(), // "YYYY-MM-DD"
    isActive: v.boolean(),
    usageCount: v.number(),
    usageLimitPerUser: v.number(),
    operatorId: v.optional(v.id("operators")), // null = all operators
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  // 22. notifications - User push/in-app notifications
  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("BOOKING_CONFIRMED"),
      v.literal("TRIP_REMINDER"),
      v.literal("SEAT_LOCKED"),
      v.literal("CANCELLATION"),
      v.literal("OFFER")
    ),
    metadata: v.optional(v.string()), // JSON string of extra props
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"]),

  // 23. supportTickets - Passenger issues
  supportTickets: defineTable({
    ticketNumber: v.string(), // "TKT-1001"
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
    status: v.union(v.literal("OPEN"), v.literal("IN_PROGRESS"), v.literal("RESOLVED"), v.literal("CLOSED")),
    priority: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("URGENT")),
    messages: v.array(
      v.object({
        sender: v.union(v.literal("USER"), v.literal("AGENT")),
        senderName: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ticketNumber", ["ticketNumber"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // 24. apiProviders - External inventory provider configurations
  apiProviders: defineTable({
    name: v.string(), // e.g. "AbhiBus Global API", "RedBus GDS", "Local Tripzo Fleet"
    code: v.string(), // "ABHIBUS", "REDBUS", "LOCAL"
    baseUrl: v.string(),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("TESTING")),
    environment: v.union(v.literal("DEVELOPMENT"), v.literal("SANDBOX"), v.literal("PRODUCTION")),
    syncFrequencyMinutes: v.number(),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // 25. apiLogs - Auditing outbound & inbound partner queries
  apiLogs: defineTable({
    providerCode: v.string(),
    endpoint: v.string(),
    method: v.string(),
    requestPayload: v.optional(v.string()),
    responsePayload: v.optional(v.string()),
    statusCode: v.number(),
    durationMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_providerCode", ["providerCode"])
    .index("by_createdAt", ["createdAt"]),

  // 26. webhookEvents - Razorpay and external gateway inbound events
  webhookEvents: defineTable({
    eventId: v.string(), // gateway event ID e.g. "evt_xxxx"
    source: v.union(v.literal("RAZORPAY_PAYMENT"), v.literal("RAZORPAY_ROUTE"), v.literal("SMS_GATEWAY")),
    eventType: v.string(), // "payment.captured", "transfer.processed"
    rawPayload: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_processed", ["processed"]),

  // 27. financialLedger - Immutable financial records
  financialLedger: defineTable({
    transactionReference: v.string(), // TXN-XXXX
    bookingId: v.optional(v.id("bookings")),
    operatorId: v.optional(v.id("operators")),
    eventType: v.union(
      v.literal("PAYMENT_INITIATED"),
      v.literal("PAYMENT_AUTHORIZED"),
      v.literal("PAYMENT_CAPTURED"),
      v.literal("PAYMENT_FAILED"),
      v.literal("COMMISSION_CALCULATED"),
      v.literal("TRANSFER_INITIATED"),
      v.literal("TRANSFER_PROCESSED"),
      v.literal("TRANSFER_FAILED"),
      v.literal("SETTLEMENT_COMPLETED"),
      v.literal("REFUND_INITIATED"),
      v.literal("REFUND_PROCESSED")
    ),
    debitAmount: v.number(),
    creditAmount: v.number(),
    balanceAfter: v.number(),
    currency: v.string(), // "INR"
    idempotencyKey: v.string(),
    notes: v.string(),
    timestamp: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_operatorId", ["operatorId"])
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_timestamp", ["timestamp"]),

  // 28. auditLogs - System security & administrative operations
  auditLogs: defineTable({
    actorType: v.union(v.literal("ADMIN"), v.literal("OPERATOR"), v.literal("SYSTEM")),
    actorId: v.string(),
    action: v.string(), // "OPERATOR_APPROVED", "COMMISSION_UPDATED", "SEAT_FORCE_UNLOCKED"
    targetEntity: v.string(), // "operators", "trips", "buses"
    targetId: v.string(),
    metadata: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_actorId", ["actorId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // 29. settings - Platform-wide configurations
  settings: defineTable({
    key: v.string(), // e.g. "PLATFORM_COMMISSION_PERCENT", "SEAT_LOCK_TIMEOUT_SECONDS", "RAZORPAY_MODE"
    value: v.string(),
    description: v.string(),
    updatedBy: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
