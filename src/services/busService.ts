import { Bus, BusFilters, SortOption } from '../types';
import { DUMMY_BUSES } from '../data/dummyData';

export const busService = {
  async getBuses(
    fromCity: string,
    toCity: string,
    filters?: Partial<BusFilters>,
    sortBy?: SortOption
  ): Promise<Bus[]> {
    // Artificial small delay for realistic loading skeleton feel
    await new Promise((res) => setTimeout(res, 350));

    // Find direct route or fallback to popular buses matching route
    let list = DUMMY_BUSES.filter(
      (b) =>
        b.departureCity.toLowerCase() === fromCity.toLowerCase() &&
        b.arrivalCity.toLowerCase() === toCity.toLowerCase()
    );

    // If no exact match for this pair, adapt available buses to this route for demo completeness
    if (list.length === 0) {
      list = DUMMY_BUSES.slice(0, 12).map((b, idx) => ({
        ...b,
        id: `adapted-${b.id}-${idx}`,
        departureCity: fromCity,
        arrivalCity: toCity,
      }));
    }

    // Apply filters
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

    // Apply sorting
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
    // Check if it's an adapted id
    if (id.startsWith('adapted-')) {
      const originalId = id.split('-')[1] + '-' + id.split('-')[2];
      const match = DUMMY_BUSES.find((b) => b.id === originalId);
      if (match) return { ...match, id };
    }
    return DUMMY_BUSES[0];
  },
};
