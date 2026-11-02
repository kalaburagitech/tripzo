import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, RouteSearch } from '../types';

const BOOKINGS_KEY = '@tripzo_bookings';
const RECENT_SEARCHES_KEY = '@tripzo_recent_searches';

export const bookingService = {
  async getBookings(): Promise<Booking[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKINGS_KEY);
      if (!data) return [];
      const bookings: Booking[] = JSON.parse(data);
      return bookings.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
    } catch {
      return [];
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const list = await this.getBookings();
    return list.find((b) => b.id === id || b.pnr === id) || null;
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'pnr' | 'bookedAt' | 'qrPayload'>): Promise<Booking> {
    const pnr = `TPZ${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `bkg_${Date.now()}`;
    const bookedAt = new Date().toISOString();

    const qrPayload = JSON.stringify({
      pnr,
      operator: bookingData.bus.operatorName,
      seats: bookingData.selectedSeats,
      date: bookingData.travelDate,
      route: `${bookingData.bus.departureCity} -> ${bookingData.bus.arrivalCity}`,
      boarding: bookingData.boardingPoint.name,
      time: bookingData.boardingPoint.time,
      passengers: bookingData.passengers.map((p) => p.name).join(', '),
      totalPaid: bookingData.totalAmount,
    });

    const newBooking: Booking = {
      ...bookingData,
      id,
      pnr,
      bookedAt,
      qrPayload,
      status: 'upcoming',
    };

    const current = await this.getBookings();
    current.unshift(newBooking);
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(current));

    return newBooking;
  },

  async cancelBooking(id: string, reason?: string): Promise<{ success: boolean; refundAmount: number; message: string }> {
    const current = await this.getBookings();
    const index = current.findIndex((b) => b.id === id || b.pnr === id);
    if (index === -1) {
      return { success: false, refundAmount: 0, message: 'Booking not found' };
    }

    const booking = current[index];
    if (booking.status === 'cancelled') {
      return { success: false, refundAmount: 0, message: 'Booking is already cancelled' };
    }

    // Calculate refund based on bus policy (default 80% refund in demo)
    const refundPercent = booking.bus.cancellationPolicy[0]?.refundPercent ?? 80;
    const refundAmount = Math.round((booking.baseFare * refundPercent) / 100);

    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
    booking.refundAmount = refundAmount;

    current[index] = booking;
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(current));

    return {
      success: true,
      refundAmount,
      message: `Ticket successfully cancelled. ₹${refundAmount} has been initiated to your original payment method.`,
    };
  },

  async getRecentSearches(): Promise<RouteSearch[]> {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return data ? JSON.parse(data) : [
        { fromCity: 'Bengaluru', toCity: 'Hyderabad', date: new Date().toISOString().split('T')[0], passengerCount: 1 },
        { fromCity: 'Bengaluru', toCity: 'Goa', date: new Date().toISOString().split('T')[0], passengerCount: 1 },
        { fromCity: 'Bengaluru', toCity: 'Kalaburagi', date: new Date().toISOString().split('T')[0], passengerCount: 1 },
      ];
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
