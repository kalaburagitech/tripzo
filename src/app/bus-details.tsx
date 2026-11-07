import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { busService } from '../services/busService';
import { Bus } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BusDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { busId, travelDate } = useLocalSearchParams<{ busId: string; travelDate: string }>();

  const [bus, setBus] = useState<Bus | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'amenities' | 'points' | 'policy'>('info');

  useEffect(() => {
    if (busId) {
      busService.getBusById(busId).then(setBus);
    }
  }, [busId]);

  if (!bus) return null;

  return (
    <View style={styles.container}>
      <TripzoHeader title={bus.operatorName} subtitle={bus.busType} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Bus Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../assets/images/sleeper-bus-banner.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.white} />
              <Text style={styles.ratingText}>{bus.rating.toFixed(1)}</Text>
              <Text style={styles.ratingSub}>({bus.ratingCount} reviews)</Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{bus.category.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Journey Card */}
        <View style={styles.card}>
          <View style={styles.journeyHeader}>
            <View>
              <Text style={styles.timeText}>{bus.departureTime}</Text>
              <Text style={styles.cityText}>{bus.departureCity}</Text>
            </View>

            <View style={styles.journeyMiddle}>
              <Text style={styles.durationText}>{bus.duration}</Text>
              <View style={styles.line} />
              <MaterialCommunityIcons name="bus" size={16} color={Colors.orange} />
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.timeText}>{bus.arrivalTime}</Text>
              <Text style={styles.cityText}>{bus.arrivalCity}</Text>
            </View>
          </View>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabsStrip}>
          {[
            { id: 'info', label: 'Overview' },
            { id: 'amenities', label: 'Amenities' },
            { id: 'points', label: 'Stops' },
            { id: 'policy', label: 'Policy' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Overview & Reviews */}
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeading}>Operator Highlights</Text>
              <View style={styles.highlightItem}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
                <Text style={styles.highlightText}>
                  Sanitized coaches with deep cleaning before every trip.
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <Ionicons name="time" size={18} color={Colors.accent} />
                <Text style={styles.highlightText}>
                  97% on-time departure and arrival record.
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <Ionicons name="flash" size={18} color={Colors.orange} />
                <Text style={styles.highlightText}>
                  Live GPS tracking shared directly on your digital boarding pass.
                </Text>
              </View>
            </View>

            {/* Passenger Reviews */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeading}>Recent Traveler Reviews</Text>
              {bus.reviews.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{r.author}</Text>
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={11} color={Colors.white} />
                      <Text style={styles.reviewRatingText}>{r.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 2: Amenities */}
        {activeTab === 'amenities' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeading}>On-board Amenities ({bus.amenities.length})</Text>
              <View style={styles.amenitiesGrid}>
                {bus.amenities.map((item) => (
                  <View key={item.id} style={styles.amenityBox}>
                    <MaterialCommunityIcons
                      name={(item.icon as any) || 'check-circle'}
                      size={22}
                      color={Colors.orange}
                    />
                    <Text style={styles.amenityName}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Boarding & Dropping Points */}
        {activeTab === 'points' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeading}>Boarding Points</Text>
              {bus.boardingPoints.map((bp) => (
                <View key={bp.id} style={styles.pointCard}>
                  <View style={styles.pointTimeBadge}>
                    <Text style={styles.pointTime}>{bp.time}</Text>
                  </View>
                  <View style={styles.pointDetails}>
                    <Text style={styles.pointName}>{bp.name}</Text>
                    <Text style={styles.pointAddress}>{bp.address}</Text>
                  </View>
                </View>
              ))}

              <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Dropping Points</Text>
              {bus.droppingPoints.map((dp) => (
                <View key={dp.id} style={styles.pointCard}>
                  <View style={[styles.pointTimeBadge, { backgroundColor: Colors.orangeLight }]}>
                    <Text style={[styles.pointTime, { color: Colors.orangeHover }]}>{dp.time}</Text>
                  </View>
                  <View style={styles.pointDetails}>
                    <Text style={styles.pointName}>{dp.name}</Text>
                    <Text style={styles.pointAddress}>{dp.address}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 4: Cancellation Policy */}
        {activeTab === 'policy' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeading}>Cancellation & Refund Policy</Text>
              <View style={styles.policyTable}>
                <View style={styles.policyHeader}>
                  <Text style={styles.policyColHead}>CANCELLATION TIMELINE</Text>
                  <Text style={[styles.policyColHead, { textAlign: 'right' }]}>REFUND %</Text>
                </View>
                {bus.cancellationPolicy.map((item, idx) => (
                  <View key={idx} style={styles.policyRow}>
                    <Text style={styles.policyTime}>{item.beforeTime}</Text>
                    <Text style={styles.policyRefund}>{item.refundPercent}%</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.policyNote}>
                * Refund amount is calculated on the base ticket fare. Convenience fee is non-refundable.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.bottomFare}>
          <Text style={styles.fareLabel}>Starting from</Text>
          <Text style={styles.farePrice}>₹{bus.price}</Text>
        </View>

        <TouchableOpacity
          style={styles.selectSeatsCta}
          onPress={() =>
            router.push({
              pathname: '/seat-selection',
              params: {
                busId: bus.id,
                travelDate: travelDate || new Date().toISOString().split('T')[0],
              },
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.selectSeatsCtaText}>Select Seats</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
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
    paddingBottom: 100,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    gap: 4,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  ratingSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  categoryBadge: {
    backgroundColor: Colors.navy,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: Radii.lg,
    padding: 16,
    ...Shadows.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  cityText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  journeyMiddle: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  line: {
    width: 60,
    height: 1.5,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  tabsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.navy,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabContent: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  highlightText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    gap: 2,
  },
  reviewRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityBox: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radii.md,
    gap: 8,
  },
  amenityName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  pointTimeBadge: {
    backgroundColor: Colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  pointTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  pointDetails: {
    flex: 1,
  },
  pointName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  pointAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  policyTable: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 10,
  },
  policyColHead: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  policyTime: {
    fontSize: 12,
    color: Colors.text,
  },
  policyRefund: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  policyNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  bottomFare: {},
  fareLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  farePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  selectSeatsCta: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    gap: 8,
    ...Shadows.md,
  },
  selectSeatsCtaText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
