import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { busService } from '../services/busService';
import { Bus, LocationPoint } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BoardingDroppingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    busId: string;
    travelDate: string;
    seats: string;
    totalFare: string;
    passengers: string;
    phone: string;
    email: string;
  }>();

  const [bus, setBus] = useState<Bus | null>(null);
  const [selectedBoarding, setSelectedBoarding] = useState<LocationPoint | null>(null);
  const [selectedDropping, setSelectedDropping] = useState<LocationPoint | null>(null);

  useEffect(() => {
    if (params.busId) {
      busService.getBusById(params.busId).then((b) => {
        if (b) {
          setBus(b);
          setSelectedBoarding(b.boardingPoints[0] || null);
          setSelectedDropping(b.droppingPoints[0] || null);
        }
      });
    }
  }, [params.busId]);

  const handleProceedToPayment = () => {
    if (!selectedBoarding) {
      showToast('Please select your boarding pickup point', { type: 'warning' });
      return;
    }
    if (!selectedDropping) {
      showToast('Please select your destination dropping point', { type: 'warning' });
      return;
    }

    router.push({
      pathname: '/payment',
      params: {
        busId: bus!.id,
        travelDate: params.travelDate,
        seats: params.seats,
        totalFare: params.totalFare,
        passengers: params.passengers,
        phone: params.phone,
        email: params.email,
        boardingPoint: JSON.stringify(selectedBoarding),
        droppingPoint: JSON.stringify(selectedDropping),
      },
    });
  };

  if (!bus) return null;

  return (
    <View style={styles.container}>
      <TripzoHeader title="Boarding & Dropping" subtitle={`${bus.departureCity} → ${bus.arrivalCity}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Boarding Points */}
        <View style={styles.sectionHeader}>
          <View style={styles.badgeNumber}>
            <Text style={styles.badgeText}>1</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Select Boarding Point ({bus.departureCity})</Text>
            <Text style={styles.sectionSubtitle}>Please arrive 15 minutes before departure</Text>
          </View>
        </View>

        <View style={styles.pointsList}>
          {bus.boardingPoints.map((point) => {
            const isSelected = selectedBoarding?.id === point.id;
            return (
              <TouchableOpacity
                key={point.id}
                style={[styles.pointCard, isSelected && styles.pointCardSelected]}
                onPress={() => setSelectedBoarding(point)}
                activeOpacity={0.7}
              >
                <View style={[styles.timeBadge, isSelected && styles.timeBadgeSelected]}>
                  <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                    {point.time}
                  </Text>
                </View>

                <View style={styles.pointInfo}>
                  <Text style={[styles.pointName, isSelected && styles.pointNameSelected]}>
                    {point.name}
                  </Text>
                  <Text style={styles.pointAddress}>{point.address}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Dropping Points */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={[styles.badgeNumber, { backgroundColor: Colors.orange }]}>
            <Text style={styles.badgeText}>2</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Select Dropping Point ({bus.arrivalCity})</Text>
            <Text style={styles.sectionSubtitle}>Approximate arrival time</Text>
          </View>
        </View>

        <View style={styles.pointsList}>
          {bus.droppingPoints.map((point) => {
            const isSelected = selectedDropping?.id === point.id;
            return (
              <TouchableOpacity
                key={point.id}
                style={[styles.pointCard, isSelected && styles.pointCardSelected]}
                onPress={() => setSelectedDropping(point)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.timeBadge,
                    { backgroundColor: Colors.orangeLight },
                    isSelected && { backgroundColor: Colors.orange },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      { color: Colors.orangeHover },
                      isSelected && { color: Colors.white },
                    ]}
                  >
                    {point.time}
                  </Text>
                </View>

                <View style={styles.pointInfo}>
                  <Text style={[styles.pointName, isSelected && styles.pointNameSelected]}>
                    {point.name}
                  </Text>
                  <Text style={styles.pointAddress}>{point.address}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryRoute}>
            {selectedBoarding?.name.split('/')[0]} → {selectedDropping?.name.split('/')[0]}
          </Text>
          <Text style={styles.summaryFare}>Total: ₹{params.totalFare}</Text>
        </View>

        <TouchableOpacity
          style={styles.proceedBtn}
          onPress={handleProceedToPayment}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedBtnText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  badgeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pointsList: {
    gap: 8,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    gap: 12,
    ...Shadows.sm,
  },
  pointCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: '#FFFBF9',
  },
  timeBadge: {
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    minWidth: 54,
    alignItems: 'center',
  },
  timeBadgeSelected: {
    backgroundColor: Colors.navy,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  timeTextSelected: {
    color: Colors.white,
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  pointNameSelected: {
    color: Colors.navy,
  },
  pointAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  summaryCol: {
    flex: 1,
    marginRight: 10,
  },
  summaryRoute: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryFare: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 2,
  },
  proceedBtn: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
    gap: 6,
  },
  proceedBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
