import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TripzoHeader } from '../components/TripzoHeader';
import { LiveBusTracker } from '../components/LiveBusTracker';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { Colors } from '../constants/theme';

export default function TrackingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingId) {
      bookingService.getBookingById(bookingId).then(setBooking);
    } else {
      // Default fallback to first booking
      bookingService.getBookings().then((list) => {
        if (list.length > 0) setBooking(list[0]);
      });
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <TripzoHeader title="Live Bus Tracking" />
        <Text style={styles.loadingText}>Loading Bus GPS Signal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TripzoHeader
        title="Live Bus Tracking"
        subtitle={`${booking.bus.operatorName} • PNR ${booking.pnr}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LiveBusTracker booking={booking} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
