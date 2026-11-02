import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { SeatMap } from '../components/SeatMap';
import { busService } from '../services/busService';
import { Bus, Seat } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';

export default function SeatSelectionScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { busId, travelDate } = useLocalSearchParams<{ busId: string; travelDate: string }>();

  const [bus, setBus] = useState<Bus | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  useEffect(() => {
    if (busId) {
      busService.getBusById(busId).then(setBus);
    }
  }, [busId]);

  const handleToggleSeat = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        showToast('Maximum 6 seats allowed per booking.', { type: 'warning' });
        return;
      }
      if (seat.status === 'female_reserved') {
        showToast('Note: This is a female-reserved seat.', { type: 'info' });
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least 1 seat to continue.', { type: 'warning' });
      return;
    }

    router.push({
      pathname: '/passenger-details',
      params: {
        busId: bus!.id,
        travelDate: travelDate || new Date().toISOString().split('T')[0],
        seats: JSON.stringify(selectedSeats.map((s) => s.seatNumber)),
        totalFare: totalPrice.toString(),
      },
    });
  };

  if (!bus) return null;

  return (
    <View style={styles.container}>
      <TripzoHeader
        title="Select Seats"
        subtitle={`${bus.operatorName} • ${bus.departureCity} → ${bus.arrivalCity}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seat Map Layout Component */}
        <SeatMap
          bus={bus}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          maxSeats={6}
        />
      </ScrollView>

      {/* Bottom Sticky Floating Summary & CTA */}
      <View style={styles.bottomBar}>
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
              selectedSeats.length === 0 && styles.continueButtonDisabled,
            ]}
            onPress={handleProceed}
            disabled={selectedSeats.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
