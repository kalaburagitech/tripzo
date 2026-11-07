import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { TripzoHeader } from '../components/TripzoHeader';
import { SeatMap } from '../components/SeatMap';
import { busService } from '../services/busService';
import { bookingService } from '../services/bookingService';
import { api } from '../services/convexClient';
import { useSessionToken } from '../services/session';
import { Bus, Seat } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SeatSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { busId, travelDate } = useLocalSearchParams<{ busId: string; travelDate: string }>();
  const token = useSessionToken();

  const [bus, setBus] = useState<Bus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (busId) {
      busService
        .getBusById(busId)
        .then((b) => (b ? setBus(b) : setLoadError(true)))
        .catch(() => setLoadError(true));
    }
  }, [busId]);

  // Live seat inventory: re-renders whenever anyone books or holds a seat.
  const seatMap = useQuery(
    api.seatLocking.getTripSeatMap,
    busId ? { tripId: busId as any, token: token ?? undefined } : 'skip'
  );

  const liveSeats: Seat[] = useMemo(() => {
    if (!seatMap) return [];
    return [...seatMap.lowerDeck, ...seatMap.upperDeck].map((s) => ({
      id: String(s.id),
      seatNumber: s.seatNumber,
      deck: s.berth,
      type: s.seatType,
      row: s.row,
      col: s.col,
      price: s.price,
      isMine: s.isMine,
      bookedByGender: s.bookedByGender === 'other' ? undefined : s.bookedByGender,
      status:
        s.status === 'BOOKED'
          ? 'booked'
          : s.status === 'LOCKED' && !s.isMine
          ? 'held'
          : s.isFemaleReserved
          ? 'female_reserved'
          : 'available',
    }));
  }, [seatMap]);

  // Drop any selected seat that someone else just took.
  const lastNotified = useRef<string>('');
  useEffect(() => {
    if (selectedSeats.length === 0 || liveSeats.length === 0) return;
    const taken = selectedSeats.filter((sel) => {
      const live = liveSeats.find((l) => l.seatNumber === sel.seatNumber);
      return !live || live.status === 'booked' || live.status === 'held';
    });
    if (taken.length > 0) {
      // Intentional: reconcile local selection with live server seat updates.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSeats((prev) => prev.filter((p) => !taken.some((t) => t.seatNumber === p.seatNumber)));
      const key = taken.map((t) => t.seatNumber).join(', ');
      if (lastNotified.current !== key) {
        lastNotified.current = key;
        showToast('Seat ' + key + ' was just taken by another traveller.', { type: 'warning' });
      }
    }
  }, [liveSeats, selectedSeats, showToast]);

  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'held') return;
    const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 6) {
        showToast('Maximum 6 seats allowed per booking.', { type: 'warning' });
        return;
      }
      if (seat.status === 'female_reserved') {
        showToast('This seat is reserved for female passengers.', { type: 'info' });
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least 1 seat to continue.', { type: 'warning' });
      return;
    }
    if (!token) {
      showToast('Please log in to book seats.', { type: 'info' });
      router.push('/auth/login');
      return;
    }

    setHolding(true);
    try {
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);
      const hold = await bookingService.holdSeats(bus!.id, seatNumbers);
      router.push({
        pathname: '/passenger-details',
        params: {
          busId: bus!.id,
          travelDate: bus!.journeyDate || travelDate || '',
          seats: JSON.stringify(seatNumbers),
          femaleSeats: JSON.stringify(
            selectedSeats.filter((s) => s.status === 'female_reserved').map((s) => s.seatNumber)
          ),
          totalFare: totalPrice.toString(),
          holdExpiresAt: String(hold.expiresAt),
        },
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not hold these seats. Please try again.', { type: 'error' });
    } finally {
      setHolding(false);
    }
  };

  if (loadError) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={Colors.textMuted} />
        <Text style={{ marginTop: 12, color: Colors.navy, fontWeight: '700' }}>
          This trip is no longer available.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.orange, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!bus || seatMap === undefined) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TripzoHeader
        title="Select Seats"
        subtitle={`${bus.operatorName} • ${bus.departureCity} → ${bus.arrivalCity}`}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Seat Map Layout Component */}
        {seatMap && seatMap.tripStatus !== 'SCHEDULED' && seatMap.tripStatus !== 'BOARDING' ? (
          <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginVertical: 12 }}>
            This trip is closed for booking.
          </Text>
        ) : null}
        <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          {seatMap?.availableCount ?? 0} seats available · updates live
        </Text>
        <SeatMap
          bus={bus}
          seats={liveSeats}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          maxSeats={6}
        />
      </ScrollView>

      {/* Bottom Sticky Floating Summary & CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.selectionSummary}>
          <Text style={styles.selectedCount}>
            {selectedSeats.length > 0
              ? `${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} Selected`
              : 'No seats selected'}
          </Text>
          <Text style={styles.seatNumbers} numberOfLines={1}>
            {selectedSeats.length > 0
              ? `Seats: ${selectedSeats.map((s) => s.seatNumber).join(', ')}`
              : 'Tap seats above to pick'}
          </Text>
        </View>

        <View style={styles.priceActionWrapper}>
          <View style={styles.priceContainer}>
            <Text style={styles.totalPriceLabel}>Total Fare</Text>
            <Text style={styles.totalPriceValue}>₹{totalPrice}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (selectedSeats.length === 0 || holding) && styles.continueButtonDisabled,
            ]}
            onPress={handleProceed}
            disabled={selectedSeats.length === 0 || holding}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{holding ? 'Holding…' : 'Continue'}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.lg,
  },
  selectionSummary: {
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  seatNumbers: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '600',
    marginTop: 1,
  },
  priceActionWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {},
  totalPriceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  continueButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: Radii.md,
    gap: 6,
    ...Shadows.sm,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
