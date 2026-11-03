import { Bus, BusFilters, SortOption } from '../types';
import { DUMMY_BUSES } from '../data/dummyData';
import { convexClient, api } from './convexClient';

export const busService = {
  async getBuses(
    fromCity: string,
    toCity: string,
    filters?: Partial<BusFilters>,
    sortBy?: SortOption,
    travelDate?: string
  ): Promise<Bus[]> {
    let list: Bus[] = [];

    // 1. Query live Convex marketplace backend
    try {
      const trips = await convexClient.query(api.buses.searchTrips, {
        fromCity,
        toCity,
        journeyDate: travelDate,
      });

      if (trips && trips.length > 0) {
        list = trips.map((t: any) => ({
          id: String(t.id),
          operatorName: t.operatorName,
          busType: t.busType,
          category: t.busType.toLowerCase().includes('sleeper')
            ? ('sleeper' as const)
            : ('seater' as const),
          isAC: t.busType.toLowerCase().includes('ac') || t.busType.toLowerCase().includes('volvo'),
          departureCity: t.fromCity,
          arrivalCity: t.toCity,
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          duration: t.duration,
          nextDayArrival: true,
          price: t.price,
          originalPrice: t.originalPrice,
          rating: t.rating || 4.6,
          ratingCount: t.reviewCount || 240,
          availableSeats: t.availableSeats,
          totalSeats: t.totalSeats,
          amenities: (t.amenities || ['WiFi', 'Charging Port', 'Blanket']).map((name: string, i: number) => ({
            id: `am_${i}`,
            name,
            icon: name.toLowerCase().includes('wifi') ? 'wifi' : 'power-plug',
          })),
          boardingPoints: (t.boardingPoints || []).map((bp: any, i: number) => ({
            id: `bp_${i}`,
            name: bp.name,
            address: bp.landmark || bp.name,
            landmark: bp.landmark,
            time: bp.time,
          })),
          droppingPoints: (t.droppingPoints || []).map((dp: any, i: number) => ({
            id: `dp_${i}`,
            name: dp.name,
            address: dp.landmark || dp.name,
            landmark: dp.landmark,
            time: dp.time,
          })),
          cancellationPolicy: [
            { beforeTime: 'Up to 24h before', refundPercent: 90 },
            { beforeTime: '12h to 24h before', refundPercent: 50 },
            { beforeTime: '0h to 12h before', refundPercent: 0 },
          ],
          reviews: [
            {
              id: 'r1',
              author: 'Rahul S.',
              rating: 5,
              date: 'Yesterday',
              comment: 'Super clean sleeper bus, smooth driving and on-time pickup.',
            },
          ],
          photos: t.images || [
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
            'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
          ],
        }));
      }
    } catch (err) {
      console.warn('Convex searchTrips failed, falling back to local dataset:', err);
    }

    // 2. Fallback to local catalog if no trips were found in backend
    if (list.length === 0) {
      list = DUMMY_BUSES.filter(
        (b) =>
          b.departureCity.toLowerCase() === fromCity.toLowerCase() &&
          b.arrivalCity.toLowerCase() === toCity.toLowerCase()
      );

      if (list.length === 0) {
        list = DUMMY_BUSES.slice(0, 12).map((b, idx) => ({
          ...b,
          id: `adapted-${b.id}-${idx}`,
          departureCity: fromCity,
          arrivalCity: toCity,
        }));
      }
    }

    // 3. Apply client-side filters
    if (filters) {
      if (filters.busTypes && filters.busTypes.length > 0) {
        list = list.filter((b) => filters.busTypes?.includes(b.category));
      }
      if (filters.acType && filters.acType !== 'all') {
        const wantsAC = filters.acType === 'ac';
        list = list.filter((b) => b.isAC === wantsAC);
      }
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        list = list.filter((b) => b.price >= min && b.price <= max);
      }
      if (filters.minRating && filters.minRating > 0) {
        list = list.filter((b) => b.rating >= filters.minRating!);
      }
      if (filters.departureSlot && filters.departureSlot !== 'all') {
        list = list.filter((b) => {
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
        list = list.filter((b) => filters.operators?.includes(b.operatorName));
      }
    }

    // 4. Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'cheapest':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'earliest':
          list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
          break;
        case 'shortest':
          list.sort((a, b) => {
            const getMins = (dur: string) => {
              const h = parseInt(dur.split('h')[0] || '0', 10);
              const m = parseInt(dur.split('h')[1]?.replace('m', '').trim() || '0', 10);
              return h * 60 + m;
            };
            return getMins(a.duration) - getMins(b.duration);
          });
          break;
        case 'highest_rated':
          list.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    return list;
  },

  async getBusById(id: string): Promise<Bus | null> {
    const bus = DUMMY_BUSES.find((b) => b.id === id);
    if (bus) return bus;
    if (id.startsWith('adapted-')) {
      const originalId = id.split('-')[1] + '-' + id.split('-')[2];
      const match = DUMMY_BUSES.find((b) => b.id === originalId);
      if (match) return { ...match, id };
    }
    return DUMMY_BUSES[0];
  },
};
