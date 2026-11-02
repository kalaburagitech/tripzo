import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  const travelDate = params.date || new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    fetchBuses();
  }, [filters, selectedSort]);

  const fetchBuses = async () => {
    setLoading(true);
    const results = await busService.getBuses(fromCity, toCity, filters, selectedSort);
    setBuses(results);
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBuses();
  };

  const handleSelectSeats = (bus: Bus) => {
    router.push({
      pathname: '/seat-selection',
      params: {
        busId: bus.id,
        travelDate,
        passengers: params.passengers || '1',
      },
    });
  };

  const hasActiveFilters =
    filters.busTypes.length > 0 ||
    filters.acType !== 'all' ||
    filters.departureSlot !== 'all' ||
    filters.minRating > 0;

  return (
    <View style={styles.container}>
      <TripzoHeader
        title={`${fromCity} → ${toCity}`}
        subtitle={`${travelDate} • ${buses.length} Buses Available`}
      />

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
                  params: { busId: b.id, travelDate },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
