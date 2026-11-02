import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripzoHeader } from '../../components/TripzoHeader';
import { COUPONS } from '../../data/dummyData';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { useToast } from '../../components/Toast';

export default function OffersScreen() {
  const { showToast } = useToast();

  const handleCopyCode = (code: string) => {
    showToast(`Coupon code ${code} copied! Use at checkout.`, { type: 'success' });
  };

  return (
    <View style={styles.container}>
      <TripzoHeader title="Offers & Discounts" showBack={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Promo Banner with Generated Asset */}
        <View style={styles.heroBanner}>
          <Image
            source={require('../../../assets/images/travel-offer.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Mega Travel Savings</Text>
            <Text style={styles.heroSub}>Save up to 15% on all intercity bus bookings</Text>
          </View>
        </View>

        {/* Coupons List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Coupons</Text>
          <Text style={styles.sectionSubtitle}>Tap any coupon to copy code</Text>
        </View>

        <View style={styles.couponsGrid}>
          {COUPONS.map((coupon) => (
            <View key={coupon.code} style={styles.couponCard}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeDiscount}>
                  <Text style={styles.discountText}>
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} FLAT OFF`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyCode(coupon.code)}
                >
                  <Ionicons name="copy-outline" size={14} color={Colors.orange} />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.couponCodeText}>{coupon.code}</Text>
              <Text style={styles.couponTitle}>{coupon.title}</Text>
              <Text style={styles.couponDesc}>{coupon.description}</Text>

              <View style={styles.termsFooter}>
                <Text style={styles.termsText}>
                  Min. Booking: ₹{coupon.minBookingAmount} • Valid till {coupon.expiryDate}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Refer & Earn Banner */}
        <View style={styles.referCard}>
          <View style={styles.referIconBox}>
            <Ionicons name="gift-outline" size={24} color={Colors.white} />
          </View>
          <View style={styles.referInfo}>
            <Text style={styles.referTitle}>Refer & Earn ₹150</Text>
            <Text style={styles.referSub}>
              Share Tripzo with fellow travelers and get bonus credits for every ride.
            </Text>
          </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    width: '100%',
    height: 160,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    ...Shadows.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(16, 27, 53, 0.75)',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  couponsGrid: {
    gap: 12,
  },
  couponCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeDiscount: {
    backgroundColor: Colors.successLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  discountText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orangeHover,
  },
  couponCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
    letterSpacing: 1,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  couponDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  termsFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  termsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderRadius: Radii.lg,
    padding: 16,
    marginTop: 20,
    gap: 14,
  },
  referIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referInfo: {
    flex: 1,
  },
  referTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  referSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
});
