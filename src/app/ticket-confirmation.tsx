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
import { DigitalPass } from '../components/DigitalPass';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';

export default function TicketConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingId) {
      bookingService.getBookingById(bookingId).then(setBooking);
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <TripzoHeader title="Booking Confirmed" showBack={false} />
        <Text style={styles.loadingText}>Generating Digital Boarding Pass...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TripzoHeader
        title="Booking Confirmed 🎉"
        subtitle={`PNR: ${booking.pnr}`}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration Banner */}
        <View style={styles.celebrationCard}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={28} color={Colors.white} />
          </View>
          <Text style={styles.successHeading}>Ticket Booked Successfully!</Text>
          <Text style={styles.successSub}>
            Your digital m-ticket and SMS confirmation have been generated.
          </Text>
        </View>

        {/* Digital Boarding Pass */}
        <DigitalPass
          booking={booking}
          onLiveTrack={() =>
            router.push({
              pathname: '/tracking',
              params: { bookingId: booking.id },
            })
          }
        />

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.myBookingsBtn}
            onPress={() => router.replace('/(tabs)/bookings')}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={18} color={Colors.white} />
            <Text style={styles.myBookingsBtnText}>View in My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color={Colors.navy} />
            <Text style={styles.homeBtnText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 20,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  celebrationCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.md,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  myBookingsBtn: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    gap: 8,
    ...Shadows.sm,
  },
  myBookingsBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  homeBtn: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.navy,
    gap: 8,
  },
  homeBtnText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
});
