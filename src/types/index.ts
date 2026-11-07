export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  isGuest?: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string; // MaterialCommunityIcons or Ionicons name
}

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  landmark?: string;
  time: string; // "20:30"
}

export interface Seat {
  id: string;
  seatNumber: string;
  deck: 'lower' | 'upper';
  type: 'seater' | 'sleeper';
  status: 'available' | 'booked' | 'selected' | 'female_reserved' | 'held';
  isMine?: boolean;
  price: number;
  row: number;
  col: number; // 0: left window, 1: left aisle, 2: right aisle, 3: right window
  bookedByGender?: 'female' | 'male';
}

export interface BusReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Bus {
  id: string;
  operatorName: string;
  busType: string; // e.g., "Bharat Benz A/C Sleeper (2+1)"
  category: 'sleeper' | 'seater' | 'semi-sleeper';
  isAC: boolean;
  departureCity: string;
  arrivalCity: string;
  departureTime: string; // "21:00"
  arrivalTime: string;   // "06:30"
  duration: string;      // "9h 30m"
  nextDayArrival: boolean;
  price: number;
  originalPrice?: number;
  rating: number;
  ratingCount: number;
  availableSeats: number;
  totalSeats: number;
  amenities: Amenity[];
  boardingPoints: LocationPoint[];
  droppingPoints: LocationPoint[];
  cancellationPolicy: {
    beforeTime: string;
    refundPercent: number;
  }[];
  reviews: BusReview[];
  photos: string[];
  // Live marketplace fields
  tripId?: string;
  operatorId?: string;
  journeyDate?: string;
  departureAt?: number;
  hasUpperDeck?: boolean;
  busNumber?: string;
  liveStatus?: 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
}

export interface Passenger {
  id: string;
  seatNumber: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minBookingAmount: number;
  expiryDate: string;
}

export interface Booking {
  id: string;
  pnr: string;
  bus: Bus;
  travelDate: string;
  selectedSeats: string[];
  passengers: Passenger[];
  contactPhone: string;
  contactEmail: string;
  boardingPoint: LocationPoint;
  droppingPoint: LocationPoint;
  baseFare: number;
  discountAmount: number;
  appliedCoupon?: string;
  convenienceFee: number;
  totalAmount: number;
  paymentMethod: 'upi' | 'card' | 'wallet' | 'netbanking';
  paymentId: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  bookedAt: string;
  cancelledAt?: string;
  refundAmount?: number;
  qrPayload: string;
  tripId?: string;
  taxAmount?: number;
  departureAt?: number;
  tripLiveStatus?: 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
}

export interface RouteSearch {
  fromCity: string;
  toCity: string;
  date: string; // "YYYY-MM-DD"
  passengerCount: number;
}

export interface BusFilters {
  busTypes: string[]; // sleeper, seater
  acType: 'all' | 'ac' | 'non-ac';
  priceRange: [number, number];
  departureSlot: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  minRating: number;
  operators: string[];
}

export type SortOption = 'cheapest' | 'earliest' | 'shortest' | 'highest_rated';
