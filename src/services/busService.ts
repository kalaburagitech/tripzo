import { Bus, BusFilters, SortOption } from '../types';
import { api, convexClient } from './convexClient';
import { DUMMY_BUSES } from '../data/dummyData';

const DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
];

function amenityIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return 'wifi';
  if (n.includes('charg') || n.includes('usb') || n.includes('power')) return 'power-plug';
  if (n.includes('blanket')) return 'bed';
  if (n.includes('water')) return 'water';
  if (n.includes('track') || n.includes('gps')) return 'map-marker-radius';
  if (n.includes('tv') || n.includes('entertain')) return 'television';
  if (n.includes('snack') || n.includes('meal')) return 'food';
  if (n.includes('emergency') || n.includes('exit')) return 'exit-run';
  if (n.includes('cctv') || n.includes('camera')) return 'cctv';
  if (n.includes('light')) return 'lightbulb-outline';
  return 'check-circle-outline';
}

const refundPolicy = (p?: {
  ninetyPercentWindowHours: number;
  fiftyPercentWindowHours: number;
}) => {
  const ninety = p?.ninetyPercentWindowHours ?? 24;
  const fifty = p?.fiftyPercentWindowHours ?? 12;
  return [
    { beforeTime: `More than ${ninety}h before departure`, refundPercent: 90 },
    { beforeTime: `${fifty}h to ${ninety}h before departure`, refundPercent: 50 },
    { beforeTime: `Less than ${fifty}h before departure`, refundPercent: 0 },
  ];
};

/** Maps a server trip card to the app's Bus model (busId === tripId). */
export function tripToBus(t: any): Bus {
  const busType: string = t.busType || '';
  const category: Bus['category'] =
    t.busCategory || (busType.toLowerCase().includes('sleeper') ? 'sleeper' : 'seater');
  const [dh, dm] = String(t.departureTime).split(':').map(Number);
  const [ah, am] = String(t.arrivalTime).split(':').map(Number);
  return {
    id: String(t.tripId ?? t.id),
    tripId: String(t.tripId ?? t.id),
    operatorId: t.operatorId,
    operatorName: t.operatorName,
    busType,
    category,
    isAC: t.isAc ?? !busType.toLowerCase().includes('non-ac'),
    hasUpperDeck: t.hasUpperDeck,
    busNumber: t.busNumber,
    departureCity: t.fromCity,
    arrivalCity: t.toCity,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    duration: t.duration,
    nextDayArrival: ah * 60 + am < dh * 60 + dm,
    journeyDate: t.journeyDate,
    departureAt: t.departureAt,
    price: t.price,
    originalPrice: undefined,
    rating: Number((t.rating ?? 4.5).toFixed(1)),
    ratingCount: t.reviewCount ?? 0,
    availableSeats: t.availableSeats,
    totalSeats: t.totalSeats,
    amenities: (t.amenities || []).map((name: string, i: number) => ({
      id: `am_${i}`,
      name,
      icon: amenityIcon(name),
    })),
    boardingPoints: (t.boardingPoints || []).map((bp: any, i: number) => ({
      id: String(bp.id ?? `bp_${i}`),
      name: bp.name,
      address: bp.landmark || bp.name,
      landmark: bp.landmark,
      time: bp.time,
    })),
    droppingPoints: (t.droppingPoints || []).map((dp: any, i: number) => ({
      id: String(dp.id ?? `dp_${i}`),
      name: dp.name,
      address: dp.landmark || dp.name,
      landmark: dp.landmark,
      time: dp.time,
    })),
    cancellationPolicy: refundPolicy(t.cancellationPolicy),
    reviews: [],
    photos: t.images && t.images.length > 0 ? t.images : DEFAULT_PHOTOS,
    liveStatus: t.liveStatus,
  };
}

function durationMinutes(dur: string) {
  const h = parseInt(dur.split('h')[0] || '0', 10) || 0;
  const m = parseInt(dur.split('h')[1]?.replace('m', '').trim() || '0', 10) || 0;
  return h * 60 + m;
}

export function applyFiltersAndSort(list: Bus[], filters?: Partial<BusFilters>, sortBy?: SortOption): Bus[] {
  let out = [...list];
  if (filters) {
    if (filters.busTypes && filters.busTypes.length > 0) {
      out = out.filter((b) => filters.busTypes!.includes(b.category));
    }
    if (filters.acType && filters.acType !== 'all') {
      const wantsAC = filters.acType === 'ac';
      out = out.filter((b) => b.isAC === wantsAC);
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      out = out.filter((b) => b.price >= min && b.price <= max);
    }
    if (filters.minRating && filters.minRating > 0) {
      out = out.filter((b) => b.rating >= filters.minRating!);
    }
    if (filters.departureSlot && filters.departureSlot !== 'all') {
      out = out.filter((b) => {
        const hour = parseInt(b.departureTime.split(':')[0], 10);
        switch (filters.departureSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 21;
          case 'night':
            return hour >= 21 || hour < 6;
          default:
            return true;
        }
      });
    }
    if (filters.operators && filters.operators.length > 0) {
      out = out.filter((b) => filters.operators!.includes(b.operatorName));
    }
  }
  switch (sortBy) {
    case 'cheapest':
      out.sort((a, b) => a.price - b.price);
      break;
    case 'earliest':
      out.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      break;
    case 'shortest':
      out.sort((a, b) => durationMinutes(a.duration) - durationMinutes(b.duration));
      break;
    case 'highest_rated':
      out.sort((a, b) => b.rating - a.rating);
      break;
  }
  return out;
}

export function todayIST(): string {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

export const busService = {
  async getBuses(
    fromCity: string,
    toCity: string,
    filters?: Partial<BusFilters>,
    sortBy?: SortOption,
    travelDate?: string
  ): Promise<Bus[]> {
    try {
      const trips = await convexClient.query(api.buses.searchTrips, {
        fromCity,
        toCity,
        journeyDate: travelDate || todayIST(),
      });
      if (trips && trips.length > 0) {
        return applyFiltersAndSort(trips.map(tripToBus), filters, sortBy);
      }
    } catch (e) {
      // Fallback to local bus fleet (VRL, SRS, Orange, IntrCity, KRL, etc.)
    }

    const localMatches = DUMMY_BUSES.filter(
      (b) =>
        b.departureCity.toLowerCase() === fromCity.toLowerCase() &&
        b.arrivalCity.toLowerCase() === toCity.toLowerCase()
    );
    const busList = localMatches.length > 0 ? localMatches : DUMMY_BUSES;
    return applyFiltersAndSort(busList, filters, sortBy);
  },

  async getBusById(tripId: string): Promise<Bus | null> {
    try {
      const t = await convexClient.query(api.buses.getTripDetails, { tripId });
      if (t) return tripToBus(t);
    } catch {}
    return DUMMY_BUSES.find((b) => b.id === tripId) || DUMMY_BUSES[0] || null;
  },

  async getServedCities(): Promise<string[]> {
    try {
      const cities = await convexClient.query(api.buses.listServedCities, {});
      if (cities && cities.length > 0) return cities;
    } catch {}
    return [
      'Bengaluru',
      'Hyderabad',
      'Goa',
      'Kalaburagi',
      'Chennai',
      'Mumbai',
      'Pune',
      'Mysuru',
      'Vijayawada',
    ];
  },
};
