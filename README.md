# Tripzo – Your Journey, Your Way 🚌

**Tripzo** is a premium-quality Android bus traveler booking application built with React Native, Expo, Expo Router, and TypeScript. It features a complete commercial-grade traveler booking experience, smooth animations, original brand design, and full local persistence with offline readiness.

---

## 🎨 Visual Identity & Design System

- **Primary Navy:** `#101B35` (Deep luxury executive tone)
- **Vibrant Orange:** `#FF7547` (Energetic CTA and highlights)
- **Success Mint:** `#18A878` (Discounts, confirmed states & live status)
- **Background Light:** `#F5F7FB` (Clean, modern canvas)
- **Text Primary:** `#19243B`
- **Typography:** Bold hierarchy, modern rounded pills, cards with soft elevations

---

## 📱 Application Flow & Features

1. **Splash Screen:**
   - Animated Tripzo app logo with spring scale and opacity transitions.
   - Tagline: *"Your Journey, Your Way"*.
   - Dynamic routing to onboarding or main dashboard based on local state.

2. **Onboarding (3 Interactive Slides):**
   - *Discover Destinations:* Explore intercity bus routes across India.
   - *Choose Your Perfect Seat:* Lower/upper sleeper berths and seater layouts.
   - *Travel With Confidence:* Live tracking, digital QR boarding passes, and cancellation.

3. **Authentication & Profile:**
   - Mobile number login with demo OTP verification (`123456`).
   - Guest login capability for instant app exploration.
   - User account registration & profile editing.
   - Saved travelers management (add/remove frequent passengers).

4. **Home Screen (Trip Planner):**
   - Personalized passenger greeting with active notifications bell.
   - Departure and destination selector with interactive swap button.
   - Quick date selector (*Today*, *Tomorrow*, *Day After*).
   - Dynamic passenger counter (1–6 travelers).
   - Search Buses CTA.
   - Recently searched routes with instant 1-tap re-search.
   - Exclusive deals carousel (*TRIPZO10*, *WELCOME100*, *WEEKEND15*).
   - Popular intercity routes (Bengaluru ↔ Hyderabad, Goa, Kalaburagi, Chennai, Mumbai, Pune, Mysuru).
   - Weekend getaways showcase with custom travel illustrations.

5. **Bus Search Results:**
   - 14 realistic intercity buses across top operators (VRL, IntrCity SmartBus, KRL Express, Orange Travels, GreenLine, SRS Travels, Seabird, Jabbar, KSRTC FlyBus, Paulo, Sharma Transports, Sugama).
   - Quick filters: AC Only, Sleeper, Seater, ★ 4.5+ Rating.
   - Filter Modal: Comprehensive filter by AC/Non-AC, Bus Type, Departure time slots, Price range, and Ratings.
   - Sort Modal: Sort by Cheapest, Earliest Departure, Shortest Duration, Highest Rated.
   - Modern skeleton shimmer loading and empty filter states.

6. **Bus Details:**
   - High-res bus photo banner and ratings.
   - Journey timeline with duration and next-day arrival badge.
   - Tabbed view: Overview, Amenities, Boarding/Dropping stops, and Cancellation Policy.
   - Recent passenger reviews and hygiene ratings.

7. **Interactive Seat Selection:**
   - Complete multi-deck support (Lower Berth & Upper Berth for Sleeper buses).
   - 2+2 layout for seater buses.
   - Real-time seat statuses: Available, Booked, Selected, and Female Reserved.
   - Dynamic fare calculation.
   - Seat selection limit of up to 6 seats per booking.

8. **Passenger Details:**
   - Individual form per selected seat: Full Name, Age, and Gender.
   - Quick 1-tap autofill from saved travelers.
   - Contact mobile number and email for ticket SMS/delivery.
   - Input validations for all fields.

9. **Boarding & Dropping Points:**
   - Select departure pickup stop with exact landmark and scheduled time.
   - Select arrival drop-off stop with landmark.

10. **Coupon & Discount Engine:**
    - `TRIPZO10`: 10% instant discount up to ₹250.
    - `WELCOME100`: Flat ₹100 discount on bookings above ₹500.
    - `WEEKEND15`: 15% discount up to ₹350 on weekend journeys.
    - Real-time discount validation and price subtraction.

11. **Payment Simulation:**
    - Simulated UPI (Google Pay, PhonePe, Paytm), Credit/Debit Card, Wallets, and Net Banking.
    - Detailed fare breakdown: Base Fare + ₹49 Convenience Fee - Applied Discounts = Total Payable.
    - Demo checkout with simulated 256-bit encryption.

12. **Digital Boarding Pass:**
    - Authentic perforated digital ticket design.
    - Unique PNR number (`TPZ######`) and booking ID.
    - Live QR code (powered by `react-native-qrcode-svg`) with journey metadata.
    - Native ticket sharing via Android Share Sheet.
    - Download ticket action with local device confirmation.

13. **My Bookings:**
    - Segmented tabs: *Upcoming*, *Completed*, *Cancelled*.
    - View full digital boarding pass anytime without internet.
    - Interactive ticket cancellation modal with dynamic refund estimation (80% base fare).

14. **Live Bus Tracking (Simulation):**
    - Moving animated bus icon on route timeline.
    - Current speed indicator (60–80 km/h).
    - Next stop ETA countdown.
    - Vehicle plate number, operator model, and driver contact.
    - One-tap Boarding Reminder toggle with notification alerts.

15. **Help & Support:**
    - Searchable FAQ accordion covering refunds, QR tickets, and female safety.
    - Toll-free and email contact shortcuts.
    - Interactive 24/7 AI Support Chat with automated answers for cancellations, tracking, and coupons.

---

## 🛠️ Project Structure

```
d:/DEMO TRAVELERS/
├── assets/
│   └── images/               # App logo, banners, travel illustrations & icons
├── src/
│   ├── app/
│   │   ├── _layout.tsx       # Root stack navigator with ToastProvider
│   │   ├── index.tsx         # Animated splash screen
│   │   ├── onboarding.tsx    # 3-slide introductory carousel
│   │   ├── search.tsx        # City search modal
│   │   ├── bus-results.tsx   # Bus listing, filtering & sorting
│   │   ├── bus-details.tsx   # Operator profile, amenities & reviews
│   │   ├── seat-selection.tsx# Interactive sleeper/seater berth map
│   │   ├── passenger-details.tsx # Form per seat & saved travelers
│   │   ├── boarding-dropping.tsx # Pickup and drop selection
│   │   ├── payment.tsx       # Coupon engine & checkout simulation
│   │   ├── ticket-confirmation.tsx # Post-booking confirmation & pass
│   │   ├── tracking.tsx      # GPS route simulation
│   │   ├── support.tsx       # FAQs & interactive support chat
│   │   ├── notifications.tsx # Alerts center
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx   # Bottom tabs navigation
│   │   │   ├── index.tsx     # Home trip planner
│   │   │   ├── bookings.tsx  # My Bookings (Upcoming/Completed/Cancelled)
│   │   │   ├── offers.tsx    # Available coupons & promotions
│   │   │   └── profile.tsx   # User profile, saved passengers & logout
│   │   └── auth/
│   │       ├── login.tsx     # Mobile OTP login & guest entry
│   │       └── signup.tsx    # New user onboarding
│   ├── components/
│   │   ├── BusCard.tsx
│   │   ├── DigitalPass.tsx
│   │   ├── FilterModal.tsx
│   │   ├── LiveBusTracker.tsx
│   │   ├── SeatMap.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── SortModal.tsx
│   │   ├── Toast.tsx
│   │   └── TripzoHeader.tsx
│   ├── constants/
│   │   └── theme.ts          # Colors, typography, shadows & radii
│   ├── data/
│   │   └── dummyData.ts      # Indian routes, 14 buses, coupons & FAQs
│   ├── services/
│   │   ├── authService.ts    # Profile & session persistence
│   │   ├── bookingService.ts # Local storage bookings & PNR engine
│   │   ├── busService.ts     # Route querying, filters & sorting
│   │   ├── couponService.ts  # Coupon calculations
│   │   ├── notificationService.ts # App notifications
│   │   ├── paymentService.ts # Simulated payment gateway
│   │   └── profileService.ts # Saved passengers store
│   └── types/
│       └── index.ts          # Complete TypeScript interfaces
├── app.json                  # Expo config (package: com.kalaburagitech.tripzo)
├── eas.json                  # EAS Build configuration (preview APK profile)
├── package.json
└── tsconfig.json
```

---

## 🚀 Running the App Locally

### Prerequisites
- Node.js (v20+ or v22+)
- Android device or Android Studio Emulator / Expo Go

### Installation
```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start
```
- Press `a` in the terminal to launch on an attached Android device or emulator.
- Scan the QR code using Expo Go on your physical Android phone.

---

## 📦 Building the Android APK

The project is configured for EAS Build preview profile to output a standalone installable `.apk` file:

```bash
eas build --platform android --profile preview
```

### Installation of APK on Android Devices:
1. Download the generated `.apk` file to your Android phone.
2. Open the file from your Downloads or Notifications bar.
3. If prompted with *"Install unknown apps"*, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and launch **Tripzo**.
