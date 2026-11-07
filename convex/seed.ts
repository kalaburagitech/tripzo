import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const seedMarketplace = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingOps = await ctx.db.query("operators").take(1);
    if (existingOps.length > 0) {
      return { success: true, message: "Marketplace already seeded!" };
    }

    const now = Date.now();

    // 1. Super Admin Account
    const adminId = await ctx.db.insert("adminUsers", {
      email: "admin@tripzo.com",
      passwordHash: "Tripzo@Admin2026",
      name: "Tripzo Super Administrator",
      role: "SUPER_ADMIN",
      isActive: true,
      createdAt: now,
    });

    // 2. 20 Realistic Indian Bus Operators
    const operatorTemplates = [
      { name: "VRL Travels", city: "Hubballi", state: "Karnataka", phone: "9845012345", rating: 4.8, rev: 1420 },
      { name: "SRS Travels", city: "Bengaluru", state: "Karnataka", phone: "9845023456", rating: 4.6, rev: 1180 },
      { name: "Orange Tours & Travels", city: "Hyderabad", state: "Telangana", phone: "9845034567", rating: 4.7, rev: 940 },
      { name: "KSRTC Swift", city: "Bengaluru", state: "Karnataka", phone: "9845045678", rating: 4.9, rev: 2310 },
      { name: "Greenline Travels", city: "Bengaluru", state: "Karnataka", phone: "9845056789", rating: 4.5, rev: 670 },
      { name: "Seabird Tourist", city: "Mangaluru", state: "Karnataka", phone: "9845067890", rating: 4.4, rev: 520 },
      { name: "Sugama Tourist", city: "Udupi", state: "Karnataka", phone: "9845078901", rating: 4.5, rev: 490 },
      { name: "Morning Star Travels", city: "Vijayawada", state: "Andhra Pradesh", phone: "9845089012", rating: 4.6, rev: 710 },
      { name: "IntrCity SmartBus", city: "Bengaluru", state: "Karnataka", phone: "9845090123", rating: 4.8, rev: 1850 },
      { name: "Zingbus", city: "New Delhi", state: "Delhi", phone: "9845101234", rating: 4.7, rev: 1340 },
      { name: "National Travels", city: "Bengaluru", state: "Karnataka", phone: "9845112345", rating: 4.3, rev: 410 },
      { name: "Jabbar Travels", city: "Bengaluru", state: "Karnataka", phone: "9845123456", rating: 4.5, rev: 620 },
      { name: "Kallada Travels", city: "Kochi", state: "Kerala", phone: "9845134567", rating: 4.4, rev: 580 },
      { name: "Paulo Travels", city: "Panaji", state: "Goa", phone: "9845145678", rating: 4.6, rev: 760 },
      { name: "Chartered Bus", city: "Indore", state: "Madhya Pradesh", phone: "9845156789", rating: 4.7, rev: 890 },
      { name: "SRM Transports", city: "Chennai", state: "Tamil Nadu", phone: "9845167890", rating: 4.6, rev: 820 },
      { name: "Sharma Transports", city: "Bengaluru", state: "Karnataka", phone: "9845178901", rating: 4.5, rev: 510 },
      { name: "Kalaburagi Express (Al-Ameen)", city: "Kalaburagi", state: "Karnataka", phone: "9845189012", rating: 4.7, rev: 430 },
      { name: "Belagavi Super Cruiser", city: "Belagavi", state: "Karnataka", phone: "9845190123", rating: 4.6, rev: 390 },
      { name: "Praveen Travels", city: "Chennai", state: "Tamil Nadu", phone: "9845201234", rating: 4.5, rev: 350 },
    ];

    const operatorIds: any[] = [];

    for (const op of operatorTemplates) {
      const email = `${op.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@operators.tripzo.com`;
      const opId = await ctx.db.insert("operators", {
        companyName: op.name,
        tradeName: op.name,
        contactPerson: `${op.name} Director`,
        phone: op.phone,
        email,
        officeAddress: `Main Terminal Road, Near Central Bus Stand, ${op.city}`,
        city: op.city,
        state: op.state,
        pincode: "560001",
        gstin: `29AAACP${Math.floor(1000 + Math.random() * 9000)}Z1Z5`,
        pan: `AAACP${Math.floor(1000 + Math.random() * 9000)}Z`,
        businessType: "PRIVATE_LIMITED",
        description: `Premium intercity bus transportation across South and Central India with verified luxury amenities and sanitized cabins.`,
        status: "APPROVED",
        commissionRate: 10.0,
        rating: op.rating,
        totalReviews: op.rev,
        totalBuses: 5,
        razorpayAccountId: `acc_${Math.floor(100000 + Math.random() * 900000)}`,
        razorpayAccountStatus: "activated",
        createdAt: now,
        updatedAt: now,
      });

      operatorIds.push(opId);

      // Create Operator Admin User
      await ctx.db.insert("adminUsers", {
        email,
        passwordHash: "Operator@123",
        name: `${op.name} Ops Manager`,
        role: "OPERATOR_ADMIN",
        operatorId: opId,
        isActive: true,
        createdAt: now,
      });

      // Operator Bank Account
      await ctx.db.insert("operatorBankAccounts", {
        operatorId: opId,
        accountHolderName: `${op.name} Pvt Ltd`,
        accountNumber: `9180${Math.floor(100000000 + Math.random() * 900000000)}`,
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
        branchName: `${op.city} Main Branch`,
        isVerified: true,
        pennyDropStatus: "SUCCESS",
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. 100 Buses (5 per operator)
    const busModels = [
      { name: "Volvo 9600 Multi-Axle AC Sleeper", type: "AC Sleeper (2+1)" as const, category: "sleeper" as const, isAc: true, seats: 36, deck: true },
      { name: "Scania Metrolink HD AC Sleeper", type: "Scania Multi-Axle Sleeper" as const, category: "sleeper" as const, isAc: true, seats: 36, deck: true },
      { name: "BharatBenz Glider AC Sleeper", type: "BharatBenz AC Sleeper" as const, category: "sleeper" as const, isAc: true, seats: 30, deck: true },
      { name: "Volvo B11R Multi-Axle Seater", type: "Volvo Multi-Axle AC" as const, category: "seater" as const, isAc: true, seats: 45, deck: false },
      { name: "Ashok Leyland Luxura AC Sleeper", type: "AC Sleeper (2+1)" as const, category: "sleeper" as const, isAc: true, seats: 36, deck: true },
    ];

    const allBusIds: any[] = [];
    for (let oIdx = 0; oIdx < operatorIds.length; oIdx++) {
      const opId = operatorIds[oIdx];
      const op = operatorTemplates[oIdx];
      const stateCode = op.state === "Karnataka" ? "KA" : op.state === "Telangana" ? "TS" : op.state === "Goa" ? "GA" : op.state === "Tamil Nadu" ? "TN" : "MH";

      for (let bIdx = 0; bIdx < 5; bIdx++) {
        const model = busModels[bIdx];
        const regNum = `${stateCode}-01-${String.fromCharCode(65 + oIdx)}${bIdx + 1}-${1000 + bIdx * 23}`;
        const busId = await ctx.db.insert("buses", {
          operatorId: opId,
          busNumber: regNum,
          name: `${op.name} ${model.name}`,
          busType: model.type,
          category: model.category,
          isAc: model.isAc,
          totalSeats: model.seats,
          hasUpperDeck: model.deck,
          amenities: ["WiFi", "Charging Port", "Blanket", "Water Bottle", "Live Tracking", "Emergency Exit", "Reading Light"],
          images: [
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800",
          ],
          rating: 4.6,
          reviewCount: 150 + bIdx * 40,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        });
        allBusIds.push({ busId, operatorId: opId, opName: op.name, totalSeats: model.seats, hasUpperDeck: model.deck, category: model.category });
      }
    }

    // 4. 50 Realistic Indian Routes with Boarding and Dropping Points
    const routePairs = [
      { from: "Bengaluru", to: "Hyderabad", dist: 570, dur: 9.0, fare: 1250 },
      { from: "Hyderabad", to: "Bengaluru", dist: 570, dur: 9.0, fare: 1250 },
      { from: "Bengaluru", to: "Chennai", dist: 350, dur: 6.0, fare: 850 },
      { from: "Chennai", to: "Bengaluru", dist: 350, dur: 6.0, fare: 850 },
      { from: "Bengaluru", to: "Goa", dist: 560, dur: 11.5, fare: 1450 },
      { from: "Goa", to: "Bengaluru", dist: 560, dur: 11.5, fare: 1450 },
      { from: "Bengaluru", to: "Kalaburagi", dist: 590, dur: 10.0, fare: 1100 },
      { from: "Kalaburagi", to: "Bengaluru", dist: 590, dur: 10.0, fare: 1100 },
      { from: "Bengaluru", to: "Mumbai", dist: 980, dur: 16.0, fare: 2100 },
      { from: "Mumbai", to: "Bengaluru", dist: 980, dur: 16.0, fare: 2100 },
      { from: "Bengaluru", to: "Pune", dist: 840, dur: 14.0, fare: 1800 },
      { from: "Pune", to: "Bengaluru", dist: 840, dur: 14.0, fare: 1800 },
      { from: "Bengaluru", to: "Mysuru", dist: 145, dur: 3.0, fare: 450 },
      { from: "Mysuru", to: "Bengaluru", dist: 145, dur: 3.0, fare: 450 },
      { from: "Bengaluru", to: "Vijayawada", dist: 660, dur: 11.0, fare: 1350 },
      { from: "Vijayawada", to: "Bengaluru", dist: 660, dur: 11.0, fare: 1350 },
      { from: "Bengaluru", to: "Coimbatore", dist: 360, dur: 6.5, fare: 900 },
      { from: "Coimbatore", to: "Bengaluru", dist: 360, dur: 6.5, fare: 900 },
      { from: "Bengaluru", to: "Mangaluru", dist: 350, dur: 7.5, fare: 950 },
      { from: "Mangaluru", to: "Bengaluru", dist: 350, dur: 7.5, fare: 950 },
      { from: "Hyderabad", to: "Vijayawada", dist: 275, dur: 5.0, fare: 700 },
      { from: "Vijayawada", to: "Hyderabad", dist: 275, dur: 5.0, fare: 700 },
      { from: "Hyderabad", to: "Chennai", dist: 630, dur: 10.5, fare: 1300 },
      { from: "Chennai", to: "Hyderabad", dist: 630, dur: 10.5, fare: 1300 },
      { from: "Mumbai", to: "Pune", dist: 150, dur: 3.5, fare: 500 },
      { from: "Pune", to: "Mumbai", dist: 150, dur: 3.5, fare: 500 },
      { from: "Mumbai", to: "Goa", dist: 590, dur: 11.0, fare: 1500 },
      { from: "Goa", to: "Mumbai", dist: 590, dur: 11.0, fare: 1500 },
      { from: "Pune", to: "Goa", dist: 450, dur: 9.0, fare: 1200 },
      { from: "Goa", to: "Pune", dist: 450, dur: 9.0, fare: 1200 },
      { from: "Kalaburagi", to: "Hyderabad", dist: 220, dur: 4.5, fare: 550 },
      { from: "Hyderabad", to: "Kalaburagi", dist: 220, dur: 4.5, fare: 550 },
      { from: "Kalaburagi", to: "Pune", dist: 370, dur: 7.0, fare: 900 },
      { from: "Pune", to: "Kalaburagi", dist: 370, dur: 7.0, fare: 900 },
      { from: "Bengaluru", to: "Belagavi", dist: 510, dur: 8.5, fare: 1150 },
      { from: "Belagavi", to: "Bengaluru", dist: 510, dur: 8.5, fare: 1150 },
      { from: "Chennai", to: "Coimbatore", dist: 505, dur: 8.5, fare: 1050 },
      { from: "Coimbatore", to: "Chennai", dist: 505, dur: 8.5, fare: 1050 },
      { from: "Chennai", to: "Madurai", dist: 460, dur: 7.5, fare: 950 },
      { from: "Madurai", to: "Chennai", dist: 460, dur: 7.5, fare: 950 },
      { from: "Bengaluru", to: "Tirupati", dist: 250, dur: 4.5, fare: 650 },
      { from: "Tirupati", to: "Bengaluru", dist: 250, dur: 4.5, fare: 650 },
      { from: "Bengaluru", to: "Hubballi", dist: 410, dur: 6.5, fare: 850 },
      { from: "Hubballi", to: "Bengaluru", dist: 410, dur: 6.5, fare: 850 },
      { from: "Hyderabad", to: "Goa", dist: 660, dur: 13.0, fare: 1750 },
      { from: "Goa", to: "Hyderabad", dist: 660, dur: 13.0, fare: 1750 },
      { from: "Mumbai", to: "Ahmedabad", dist: 530, dur: 9.0, fare: 1200 },
      { from: "Ahmedabad", to: "Mumbai", dist: 530, dur: 9.0, fare: 1200 },
      { from: "Bengaluru", to: "Kochi", dist: 550, dur: 10.0, fare: 1400 },
      { from: "Kochi", to: "Bengaluru", dist: 550, dur: 10.0, fare: 1400 },
    ];

    const todayStr = new Date().toISOString().split("T")[0];

    for (let rIdx = 0; rIdx < routePairs.length; rIdx++) {
      const rp = routePairs[rIdx];
      const assignedOpId = operatorIds[rIdx % operatorIds.length];

      const routeId = await ctx.db.insert("routes", {
        operatorId: assignedOpId,
        fromCity: rp.from,
        toCity: rp.to,
        distanceKm: rp.dist,
        typicalDurationHours: rp.dur,
        basePrice: rp.fare,
        isActive: true,
        createdAt: now,
      });

      // Boarding Points
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: assignedOpId,
        type: "BOARDING",
        stopName: `${rp.from} Main Terminal`,
        landmark: "Platform 4, Intercity Bay",
        city: rp.from,
        offsetMinutes: 0,
        orderIndex: 1,
      });
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: assignedOpId,
        type: "BOARDING",
        stopName: `${rp.from} Toll Gate Junction`,
        landmark: "Highway Flyover Point",
        city: rp.from,
        offsetMinutes: 30,
        orderIndex: 2,
      });

      // Dropping Points
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: assignedOpId,
        type: "DROPPING",
        stopName: `${rp.to} Bypass Ring Road`,
        landmark: "Service Road Drop Point",
        city: rp.to,
        offsetMinutes: Math.round(rp.dur * 60) - 30,
        orderIndex: 1,
      });
      await ctx.db.insert("routeStops", {
        routeId,
        operatorId: assignedOpId,
        type: "DROPPING",
        stopName: `${rp.to} Central Station`,
        landmark: "City Center Metro Gate 2",
        city: rp.to,
        offsetMinutes: Math.round(rp.dur * 60),
        orderIndex: 2,
      });

      // Schedule at least 1-2 Trips on this route
      const busInfo = allBusIds[rIdx % allBusIds.length];
      const departureTimes = ["21:00", "22:15", "23:00", "06:30", "14:00"];
      const depTime = departureTimes[rIdx % departureTimes.length];

      const tripId = await ctx.db.insert("trips", {
        operatorId: busInfo.operatorId,
        busId: busInfo.busId,
        routeId,
        fromCity: rp.from,
        toCity: rp.to,
        journeyDate: todayStr,
        departureTime: depTime,
        arrivalTime: "06:30",
        duration: `${Math.floor(rp.dur)}h ${Math.round((rp.dur % 1) * 60)}m`,
        baseFare: rp.fare,
        availableSeatsCount: busInfo.totalSeats,
        totalSeatsCount: busInfo.totalSeats,
        liveStatus: "SCHEDULED",
        cancellationPolicy: {
          zeroRefundWindowHours: 4,
          fiftyPercentWindowHours: 12,
          ninetyPercentWindowHours: 24,
        },
        createdAt: now,
        updatedAt: now,
      });

      // Populate Seats for trip
      const seatsPerDeck = busInfo.hasUpperDeck ? Math.floor(busInfo.totalSeats / 2) : busInfo.totalSeats;
      for (let i = 1; i <= seatsPerDeck; i++) {
        await ctx.db.insert("tripSeats", {
          tripId,
          seatNumber: `L${i}`,
          seatType: busInfo.category === "seater" ? "seater" : "sleeper",
          berth: "lower",
          row: Math.ceil(i / 3),
          col: ((i - 1) % 3) + 1,
          price: rp.fare,
          status: i === 3 ? "BOOKED" : "AVAILABLE",
          isFemaleReserved: i <= 2,
          version: 1,
        });
      }
      if (busInfo.hasUpperDeck) {
        for (let i = 1; i <= seatsPerDeck; i++) {
          await ctx.db.insert("tripSeats", {
            tripId,
            seatNumber: `U${i}`,
            seatType: "sleeper",
            berth: "upper",
            row: Math.ceil(i / 3),
            col: ((i - 1) % 3) + 1,
            price: rp.fare + 100,
            status: "AVAILABLE",
            isFemaleReserved: i <= 2,
            version: 1,
          });
        }
      }
    }

    // 5. Promotional Coupons
    await ctx.db.insert("coupons", {
      code: "TRIPZO10",
      title: "Flat 10% Off",
      description: "Get 10% instant discount up to ₹150 on any bus booking.",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 150,
      minBookingAmount: 500,
      validUntil: "2027-12-31",
      isActive: true,
      usageCount: 0,
      usageLimitPerUser: 5,
      createdAt: now,
    });

    await ctx.db.insert("coupons", {
      code: "WELCOME100",
      title: "Flat ₹100 Off on First Trip",
      description: "Special welcome offer for new travelers across all routes.",
      discountType: "FLAT",
      discountValue: 100,
      minBookingAmount: 400,
      validUntil: "2027-12-31",
      isActive: true,
      usageCount: 0,
      usageLimitPerUser: 1,
      createdAt: now,
    });

    await ctx.db.insert("coupons", {
      code: "WEEKEND15",
      title: "Weekend Getaway 15% Off",
      description: "Enjoy 15% off up to ₹250 on weekend departures.",
      discountType: "PERCENTAGE",
      discountValue: 15,
      maxDiscount: 250,
      minBookingAmount: 800,
      validUntil: "2027-12-31",
      isActive: true,
      usageCount: 0,
      usageLimitPerUser: 3,
      createdAt: now,
    });

    // Convert the seeded trips into daily schedules so inventory keeps rolling forward
    await ctx.scheduler.runAfter(0, internal.schedules.backfillSchedulesFromTrips, {});

    return {
      success: true,
      operatorsCount: operatorIds.length,
      busesCount: allBusIds.length,
      routesCount: routePairs.length,
      message: "Tripzo marketplace successfully seeded with 20 operators, 100 buses, 50 routes, trips & coupons!",
    };
  },
});
