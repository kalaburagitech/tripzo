import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { BusCard } from '../components/BusCard';
import { BusListSkeleton } from '../components/SkeletonLoader';
import { FilterModal } from '../components/FilterModal';
import { SortModal } from '../components/SortModal';
import { CalendarModal } from '../components/CalendarModal';
import { busService } from '../services/busService';
import { Bus, BusFilters, SortOption } from '../types';
import { Colors, Radii, Shadows } from '../constants/theme';

export default function BusResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from: string;
    to: string;
    date: string;
    passengers: string;
  }>();

  const fromCity = params.from || 'Bengaluru';
  const toCity = params.to || 'Hyderabad';
  const [currentDate, setCurrentDate] = useState<string>(
    params.date || new Date().toISOString().split('T')[0]
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>('cheapest');

  const [filters, setFilters] = useState<BusFilters>({
    busTypes: [],
    acType: 'all',
    priceRange: [400, 2000],
    departureSlot: 'all',
    minRating: 0,
    operators: [],
  });

  const fetchBuses = async () => {
    setLoading(true);
    const results = await busService.getBuses(fromCity, toCity, filters, selectedSort, currentDate);
    setBuses(results);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuses();
  }, [filters, selectedSort, currentDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuses();
  };

  const handleSelectSeats = (bus: Bus) => {
    router.push({
      pathname: '/seat-selection',
      params: {
        busId: bus.id,
        travelDate: currentDate,
        passengers: params.passengers || '1',
      },
    });
  };

  const hasActiveFilters =
    filters.busTypes.length > 0 ||
    filters.acType !== 'all' ||
    filters.departureSlot !== 'all' ||
    filters.minRating > 0;

  // Generate 7-day carousel around currentDate
  const todayIso = new Date().toISOString().split('T')[0];
  const dateStripItems = (() => {
    const list: Array<{ iso: string; dayName: string; dayNum: string; isToday: boolean }> = [];
    const base = new Date(currentDate + 'T00:00:00');
    // Start from max(today, currentDate - 1 day)
    const start = new Date(base);
    start.setDate(start.getDate() - 1);
    const startIso = start.toISOString().split('T')[0];
    const effectiveStart = startIso < todayIso ? new Date(todayIso + 'T00:00:00') : start;

    for (let i = 0; i < 7; i++) {
      const d = new Date(effectiveStart);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      list.push({
        iso,
        dayName,
        dayNum,
        isToday: iso === todayIso,
      });
    }
    return list;
  })();

  const formatHeaderDate = (iso: string) => {
    try {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      <TripzoHeader
        title={`${fromCity} → ${toCity}`}
        subtitle={`${formatHeaderDate(currentDate)} • ${buses.length} Buses Available`}
      />

      {/* Interactive Horizontal Date Selection Strip */}
      <View style={styles.dateStripContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripScroll}
        >
          {dateStripItems.map((item) => {
            const active = item.iso === currentDate;
            return (
              <TouchableOpacity
                key={item.iso}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => setCurrentDate(item.iso)}
              >
                <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>
                  {item.isToday ? 'Today' : item.dayName}
                </Text>
                <Text style={[styles.dateChipDate, active && styles.dateChipTextActive]}>
                  {item.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Calendar Picker Button */}
          <TouchableOpacity
            style={styles.calendarStripBtn}
            onPress={() => setIsCalendarOpen(true)}
          >
            <Ionicons name="calendar" size={16} color={Colors.orange} />
            <Text style={styles.calendarStripBtnText}>Calendar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Filter & Sort Action Strip */}
      <View style={styles.filterStrip}>
        <TouchableOpacity
          style={[styles.filterActionBtn, hasActiveFilters && styles.filterActionBtnActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="funnel"
            size={14}
            color={hasActiveFilters ? Colors.white : Colors.navy}
          />
          <Text style={[styles.filterActionText, hasActiveFilters && styles.filterActionTextActive]}>
            Filters {hasActiveFilters ? '• Active' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterActionBtn}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.navy} />
          <Text style={styles.filterActionText}>
            Sort: {selectedSort.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick AC / Sleeper Toggle Filters */}
      <View style={styles.quickFiltersRow}>
        <TouchableOpacity
          style={[
            styles.quickPill,
            filters.acType === 'ac' && styles.quickPillActive,
          ]}
          onPress={() =>
            setFilters({
              ...filters,
              acType: filters.acType === 'ac' ? 'all' : 'ac',
            })
          }
        >
          <Text
            style={[
              styles.quickPillText,
              filters.acType === 'ac' && styles.quickPillTextActive,
            ]}
          >
            AC Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickPill,
            filters.busTypes.includes('sleeper') && styles.quickPillActive,
          ]}
          onPress={() => {
            const types = filters.busTypes.includes('sleeper')
              ? filters.busTypes.filter((t) => t !== 'sleeper')
              : [...filters.busTypes, 'sleeper'];
            setFilters({ ...filters, busTypes: types });
          }}
        >
          <Text
            style={[
              styles.quickPillText,
              filters.busTypes.includes('sleeper') && styles.quickPillTextActive,
            ]}
          >
            Sleeper
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickPill,
            filters.busTypes.includes('seater') && styles.quickPillActive,
          ]}
          onPress={() => {
            const types = filters.busTypes.includes('seater')
              ? filters.busTypes.filter((t) => t !== 'seater')
              : [...filters.busTypes, 'seater'];
            setFilters({ ...filters, busTypes: types });
          }}
        >
          <Text
            style={[
              styles.quickPillText,
              filters.busTypes.includes('seater') && styles.quickPillTextActive,
            ]}
          >
            Seater
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickPill,
            filters.minRating === 4.5 && styles.quickPillActive,
          ]}
          onPress={() =>
            setFilters({
              ...filters,
              minRating: filters.minRating === 4.5 ? 0 : 4.5,
            })
          }
        >
          <Text
            style={[
              styles.quickPillText,
              filters.minRating === 4.5 && styles.quickPillTextActive,
            ]}
          >
            ★ 4.5+ Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bus Results List or Skeletons */}
      {loading ? (
        <BusListSkeleton count={4} />
      ) : buses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bus-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Buses Found</Text>
          <Text style={styles.emptySubtitle}>
            No buses matched your specific filter criteria. Try resetting filters to view all buses.
          </Text>
          <TouchableOpacity
            style={styles.resetFiltersBtn}
            onPress={() =>
              setFilters({
                busTypes: [],
                acType: 'all',
                priceRange: [400, 2000],
                departureSlot: 'all',
                minRating: 0,
                operators: [],
              })
            }
          >
            <Text style={styles.resetFiltersText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusCard
              bus={item}
              onSelectSeats={handleSelectSeats}
              onViewDetails={(b) =>
                router.push({
                  pathname: '/bus-details',
                  params: { busId: b.id, travelDate: currentDate },
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.orange}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() =>
          setFilters({
            busTypes: [],
            acType: 'all',
            priceRange: [400, 2000],
            departureSlot: 'all',
            minRating: 0,
            operators: [],
          })
        }
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        selectedSort={selectedSort}
        onClose={() => setShowSortModal(false)}
        onSelect={(sort) => setSelectedSort(sort)}
      />

      {/* Calendar Modal */}
      <CalendarModal
        visible={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={(newDate) => setCurrentDate(newDate)}
        minDate={todayIso}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dateStripContainer: {
    backgroundColor: '#0F1A34',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D52',
  },
  dateStripScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  dateChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#1E2D52',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
  },
  dateChipActive: {
    backgroundColor: Colors.orange,
    ...Shadows.sm,
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  dateChipDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 1,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  calendarStripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 117, 71, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 117, 71, 0.4)',
  },
  calendarStripBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.orange,
  },
  filterStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  filterActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterActionBtnActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  filterActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  filterActionTextActive: {
    color: Colors.white,
  },
  quickFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  quickPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPillActive: {
    backgroundColor: Colors.orangeLight,
    borderColor: Colors.orange,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickPillTextActive: {
    color: Colors.orangeHover,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFiltersBtn: {
    marginTop: 20,
    backgroundColor: Colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
  },
  resetFiltersText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
