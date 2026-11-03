# TRIPZO MULTI-OPERATOR BUS BOOKING MARKETPLACE ARCHITECTURE

## 1. Executive Summary

Tripzo has been elevated from a single-operator demo application into a complete, enterprise-grade, redBus-style multi-operator Indian bus booking marketplace.

- **Passenger Mobile Application:** Built with Expo React Native, TypeScript, Expo Router, and AsyncStorage.
- **Backend Infrastructure:** Powered by [Convex Cloud](https://prestigious-anteater-117.convex.cloud) with 29 database tables, real-time optimistic seat locking, scheduled jobs, and HTTP webhook receivers.
- **Web Portals:** Built with Next.js 15, React 19, TypeScript, and Tailwind CSS. Provides a unified portal gateway (`/`), Super Admin Console (`/admin`), Operator Management Portal (`/operator`), and Bus Company Self-Registration (`/operator/register`).
- **Payment & Settlements:** Integrated with Razorpay Payment Gateway for UPI/Card checkout and Razorpay Route for linked-account automated marketplace settlements (10% platform commission / 90% operator payout).

---

## 2. Live Convex Backend Deployment

- **Deployment Name:** `dev/kalaburagitech (prestigious-anteater-117)`
- **Region:** US East (N. Virginia)
- **Cloud Query & Mutation URL:** `https://prestigious-anteater-117.convex.cloud`
- **HTTP Site & Webhook Actions URL:** `https://prestigious-anteater-117.convex.site`

### Database Inventory:
- **Registered Bus Operators:** 20 verified private Indian operators (VRL Travels, SRS Travels, Orange Tours, KSRTC Swift, Seabird, Sugama, IntrCity, Zingbus, etc.)
- **Fleet Size:** 100 buses (Volvo Multi-Axle, Scania Sleeper, BharatBenz AC Sleeper 2+1, Ashok Leyland Luxura)
- **Master Routes:** 50 high-traffic Indian intercity routes (Bengaluru ↔ Hyderabad, Bengaluru ↔ Chennai, Bengaluru ↔ Goa, Bengaluru ↔ Mumbai, Bengaluru ↔ Kalaburagi, etc.)
- **Promotional Coupons:** `TRIPZO10` (10% off up to ₹150), `WELCOME100` (₹100 flat off), `WEEKEND15` (15% off up to ₹250)

---

## 3. Database Schema (29 Tables)

All tables are defined in [`convex/schema.ts`](file:///d:/DEMO%20TRAVELERS/convex/schema.ts) with strict type validation and optimized composite indexes:

1. `users` – Passenger profiles and saved traveler companions.
2. `adminUsers` – Role-based admin access (`SUPER_ADMIN`, `OPERATOR_ADMIN`, `BOOKING_SUPPORT`).
3. `operators` – Bus companies, KYC status, contact info, and commission configuration.
4. `operatorDocuments` – Verification documents (PAN, GSTIN, Permits, Cancelled Cheques).
5. `operatorBankAccounts` – Protected settlement bank accounts (Penny drop validation, IFSC, Razorpay Fund Accounts).
6. `buses` – Fleet vehicles, categories, deck configurations, and verified amenities.
7. `busLayouts` – Seater and 2+1 sleeper layout templates.
8. `cities` – Master cities with geolocation.
9. `routes` – Intercity routes with distance, duration, and base fares.
10. `routeStops` – Boarding and dropping stops with landmark landmarks and minute offsets.
11. `trips` – Scheduled journeys with real-time seat availability and cancellation windows.
12. `tripSeats` – Real-time seat inventory with optimistic locking versions (`AVAILABLE`, `LOCKED`, `BOOKED`).
13. `passengers` – Passenger manifest records per booking.
14. `bookings` – Master orders, PNR codes, fare breakdowns, and QR payloads.
15. `bookingSeats` – Fast seat-to-booking query junction.
16. `payments` – Payment transactions (Razorpay & simulated dev).
17. `paymentAttempts` – Complete audit log of all payment checkout attempts.
18. `commissions` – Global and operator-specific commission rules.
19. `settlements` – Operator marketplace payouts (Razorpay Route).
20. `refunds` – Cancellation reversals and gateway refunds.
21. `coupons` – Promotional discount rules and redemption limits.
22. `notifications` – Push and in-app trip alerts.
23. `supportTickets` – Customer support tickets with message histories.
24. `apiProviders` – External bus inventory provider configurations (AbhiBus, RedBus GDS).
25. `apiLogs` – External GDS request/response audit trails.
26. `webhookEvents` – Idempotent gateway event records.
27. `financialLedger` – Immutable double-entry financial ledger (Debit / Credit / Balance).
28. `auditLogs` – System security and admin activity logs.
29. `settings` – Global platform configuration key-values.

---

## 4. Concurrency-Safe Seat Locking Engine

Implemented in [`convex/seatLocking.ts`](file:///d:/DEMO%20TRAVELERS/convex/seatLocking.ts):
- **Temporary Seat Locking:** When a passenger selects seats, they are placed in a `LOCKED` state with a 10-minute expiry timestamp.
- **Race Condition Prevention:** Optimistic concurrency version checks prevent two passengers from locking or purchasing the same berth.
- **Auto-Expiration:** A scheduled Convex Cron job ([`convex/crons.ts`](file:///d:/DEMO%20TRAVELERS/convex/crons.ts)) executes every 2 minutes to automatically release abandoned locks back to `AVAILABLE`.

---

## 5. Web Admin & Operator Portals (Next.js)

Located in [`admin/`](file:///d:/DEMO%20TRAVELERS/admin/):

- **`/` (Marketplace Gateway):** High-level overview, live KPI cards, links to Super Admin, Operator Portal, and Registration.
- **`/admin` (Super Admin Console):**
  - Gross Booking Value (GBV), Platform Commission, Operator Payables.
  - Operator Approvals (One-click Approve / Reject / Suspend).
  - Fleet inventory (100 buses across operators).
  - 50 Master Routes and live scheduled trips.
  - Immutable Financial Ledger & Razorpay Route payout execution.
  - Active coupon manager.
- **`/operator` (Operator Management Portal):**
  - Bus company switcher to manage any of the 20 operators.
  - Fleet vehicles list and seating layouts.
  - Conductor passenger manifest.
  - T+1 settlement ledger (Net 90% payout).
- **`/operator/register` (Bus Company Self-Registration):**
  - Form for new private bus companies to onboard.
  - Captures legal business name, GSTIN, PAN, and settlement bank account.
  - Enters `PENDING` status awaiting Super Admin verification.

---

## 6. Payment & Marketplace Settlement Architecture

```
Passenger App  -->  Razorpay Order  -->  Tripzo Master Account  -->  Booking Confirmed
                                                                           │
                                  ┌────────────────────────────────────────┴────────────────────────────────────────┐
                                  ▼                                                                                 ▼
                     10% Platform Commission                                                            90% Operator Share
                     Credited to Tripzo Ledger                                                          Queued in Settlements
                                                                                                                    │
                                                                                                                    ▼
                                                                                                          Razorpay Route Transfer
                                                                                                        Linked Operator Bank Account
```

---

## 7. Commands & Verification

### Run Passenger Android Mobile App:
```bash
npx expo start
```

### Run Next.js Admin & Operator Portal:
```bash
cd admin
npm run dev
# Open http://localhost:3000
```

### Push Convex Schema & Functions:
```bash
npx convex dev --once
```

### Seed Convex Cloud Database:
```bash
npx convex run seed:seedMarketplace
```

### Run Typechecks:
```bash
# Passenger Mobile App (Root)
npx tsc --noEmit

# Admin Web Portal
cd admin && npm run build
```
