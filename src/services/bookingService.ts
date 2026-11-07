import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, Bus, Passenger, RouteSearch, LocationPoint } from '../types';
import { api, convexClient, errorMessage } from './convexClient';
import { session } from './session';
import { todayIST } from './busService';

const RECENT_SEARCHES_KEY = '@tripzo_recent_searches';

type PayMethod = 'upi' | 'card' | 'wallet' | 'netbanking';

/** Maps an enriched server booking to the app's Booking model. */
export function toBooking(b: any): Booking {
  const dep = b.departureAt as number | undefined;
  let status: Booking['status'] = 'upcoming';
  if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'REFUNDED') status = 'cancelled';
  else if (b.tripLiveStatus === 'CANCELLED') status = 'cancelled';
  else if (b.tripLiveStatus === 'COMPLETED' || (dep && dep < Date.now() - 6 * 3600_000)) status = 'completed';

  const busType: string = b.busType || '';
  const bus: Bus = {
    id: String(b.tripId),
    tripId: String(b.tripId),
    operatorId: b.operatorId,
    operatorName: b.operatorName,
    busType,
    category: b.busCategory || 'sleeper',
    isAC: b.isAc ?? true,
    busNumber: b.busNumber,
    departureCity: b.fromCity,
    arrivalCity: b.toCity,
    departureTime: b.departureTime,
    arrivalTime: b.arrivalTime,
    duration: b.duration || '',
    nextDayArrival: String(b.arrivalTime) < String(b.departureTime),
    journeyDate: b.journeyDate,
    departureAt: dep,
    price: Math.round(b.baseFare / Math.max(1, b.seatNumbers.length)),
    rating: b.operatorRating ?? 4.5,
    ratingCount: 0,
    availableSeats: 0,
    totalSeats: 0,
    amenities: (b.amenities || []).map((name: string, i: number) => ({
      id: `am_${i}`,
      name,
      icon: 'check-circle-outline',
    })),
    boardingPoints: [],
    droppingPoints: [],
    cancellationPolicy: [],
    reviews: [],
    photos: [],
    liveStatus: b.tripLiveStatus,
  };

  const point = (p: any, id: string): LocationPoint => ({
    id,
    name: p.name,
    address: p.landmark || p.name,
    landmark: p.landmark,
    time: p.time,
  });

  return {
    id: String(b._id),
    pnr: b.pnr,
    bus,
    tripId: String(b.tripId),
    travelDate: b.journeyDate,
    selectedSeats: b.seatNumbers,
    passengers: (b.passengers || []).map((p: any) => ({
      id: String(p.id),
      seatNumber: p.seatNumber,
      name: p.name,
      age: p.age,
      gender: p.gender,
    })),
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail,
    boardingPoint: point(b.boardingPoint, 'bp'),
    droppingPoint: point(b.droppingPoint, 'dp'),
    baseFare: b.baseFare,
    discountAmount: b.discountAmount,
    appliedCoupon: b.couponCode,
    convenienceFee: b.convenienceFee,
    taxAmount: b.taxAmount,
    totalAmount: b.totalAmount,
    paymentMethod: String(b.paymentMethod || 'UPI').toLowerCase() as PayMethod,
    paymentId: b.gatewayPaymentId || '',
    status,
    bookedAt: new Date(b.createdAt).toISOString(),
    cancelledAt: b.cancellationDetails ? new Date(b.cancellationDetails.cancelledAt).toISOString() : undefined,
    refundAmount: b.cancellationDetails?.refundAmount,
    qrPayload: b.qrCodeData,
    departureAt: dep,
    tripLiveStatus: b.tripLiveStatus,
  };
}

export const bookingService = {
  async getBookings(): Promise<Booking[]> {
    const token = await session.load();
    if (!token) return [];
    const list = await convexClient.query(api.bookings.getMyBookings, { token });
    return list.map(toBooking);
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const token = await session.load();
    if (!token) return null;
    const b = await convexClient.query(api.bookings.getMyBooking, { token, bookingId: id });
    return b ? toBooking(b) : null;
  },

  /** Holds seats on the server for 10 minutes. Throws with a readable message. */
  async holdSeats(tripId: string, seatNumbers: string[], gender?: 'male' | 'female' | 'other') {
    const token = await session.require();
    try {
      return await convexClient.mutation(api.seatLocking.lockSeats, {
        token,
        tripId: tripId as any,
        seatNumbers,
        gender,
      });
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  },

  async releaseSeats(tripId: string) {
    const token = session.get();
    if (!token) return;
    try {
      await convexClient.mutation(api.seatLocking.unlockSeats, { token, tripId: tripId as any });
    } catch {}
  },

  async createBooking(input: {
    tripId: string;
    seatNumbers: string[];
    passengers: Passenger[];
    boardingPoint: LocationPoint;
    droppingPoint: LocationPoint;
    contactPhone: string;
    contactEmail: string;
    couponCode?: string;
    paymentMethod: PayMethod;
    expectedTotal?: number;
  }): Promise<{ bookingId: string; pnr: string; totalAmount: number }> {
    const token = await session.require();
    try {
      const res = await convexClient.mutation(api.bookings.createBooking, {
        token,
        tripId: input.tripId as any,
        seatNumbers: input.seatNumbers,
        passengers: input.passengers.map((p) => ({
          name: p.name,
          age: Number(p.age),
          gender: p.gender,
          seatNumber: p.seatNumber,
        })),
        boardingPoint: {
          name: input.boardingPoint.name,
          time: input.boardingPoint.time,
          landmark: input.boardingPoint.landmark,
        },
        droppingPoint: {
          name: input.droppingPoint.name,
          time: input.droppingPoint.time,
          landmark: input.droppingPoint.landmark,
        },
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        couponCode: input.couponCode,
        paymentMethod: input.paymentMethod.toUpperCase() as 'UPI' | 'CARD' | 'WALLET' | 'NETBANKING',
        expectedTotal: input.expectedTotal,
      });
      return { bookingId: String(res.bookingId), pnr: res.pnr, totalAmount: res.totalAmount };
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  },

  async cancelBooking(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; refundAmount: number; message: string }> {
    try {
      const token = await session.require();
      const res = await convexClient.mutation(api.bookings.cancelBooking, {
        token,
        bookingId: id as any,
        reason,
      });
      return { success: true, refundAmount: res.refundAmount, message: res.message };
    } catch (err) {
      return { success: false, refundAmount: 0, message: errorMessage(err) };
    }
  },

  async getRecentSearches(): Promise<RouteSearch[]> {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const today = todayIST();
      const list: RouteSearch[] = data
        ? JSON.parse(data)
        : [
            { fromCity: 'Bengaluru', toCity: 'Hyderabad', date: today, passengerCount: 1 },
            { fromCity: 'Bengaluru', toCity: 'Goa', date: today, passengerCount: 1 },
            { fromCity: 'Bengaluru', toCity: 'Kalaburagi', date: today, passengerCount: 1 },
          ];
      // Never offer a past date from history
      return list.map((s) => (s.date < today ? { ...s, date: today } : s));
    } catch {
      return [];
    }
  },

  async addRecentSearch(search: RouteSearch): Promise<void> {
    try {
      let list = await this.getRecentSearches();
      list = list.filter(
        (s) =>
          s.fromCity.toLowerCase() !== search.fromCity.toLowerCase() ||
          s.toCity.toLowerCase() !== search.toCity.toLowerCase()
      );
      list.unshift(search);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {}
  },
};
