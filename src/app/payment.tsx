import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { couponService } from '../services/couponService';
import { paymentService } from '../services/paymentService';
import { bookingService } from '../services/bookingService';
import { notificationService } from '../services/notificationService';
import { LocationPoint, Passenger, Bus } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';

export default function PaymentScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    busId: string;
    travelDate: string;
    seats: string;
    totalFare: string;
    passengers: string;
    phone: string;
    email: string;
    boardingPoint: string;
    droppingPoint: string;
  }>();

  const baseFare = parseInt(params.totalFare || '0', 10);
  const convenienceFee = 49;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'netbanking'>('upi');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Card dummy fields
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8910');
  const [upiId, setUpiId] = useState('traveler@okhdfcbank');

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalAmount = Math.max(0, baseFare + convenienceFee - discountAmount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) {
      showToast('Please enter a coupon code', { type: 'warning' });
      return;
    }

    const result = couponService.validateAndApply(code, baseFare);
    if (result.valid) {
      setAppliedCoupon({
        code: result.coupon!.code,
        discount: result.discountAmount,
        title: result.coupon!.title,
      });
      setCouponCode(result.coupon!.code);
      showToast(result.message, { type: 'success' });
    } else {
      showToast(result.message, { type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed', { type: 'info' });
  };

  const handlePayNow = async () => {
    setLoading(true);

    try {
      // 1. Simulate payment
      const paymentRes = await paymentService.simulatePayment(finalAmount, paymentMethod);

      // Parse payload details
      const selectedSeats: string[] = JSON.parse(params.seats);
      const passengers: Passenger[] = JSON.parse(params.passengers);
      const boardingPoint: LocationPoint = JSON.parse(params.boardingPoint);
      const droppingPoint: LocationPoint = JSON.parse(params.droppingPoint);

      // Fetch or build bus reference
      const { busService } = await import('../services/busService');
      const bus = await busService.getBusById(params.busId);

      // 2. Persist booking locally
      const newBooking = await bookingService.createBooking({
        bus: bus!,
        travelDate: params.travelDate,
        selectedSeats,
        passengers,
        contactPhone: params.phone,
        contactEmail: params.email,
        boardingPoint,
        droppingPoint,
        baseFare,
        discountAmount,
        appliedCoupon: appliedCoupon?.code,
        convenienceFee,
        totalAmount: finalAmount,
        paymentMethod,
        paymentId: paymentRes.transactionId,
        status: 'upcoming',
      });

      // 3. Trigger booking confirmation notification
      await notificationService.addNotification(
        'Booking Confirmed!',
        `Your ticket for ${bus!.departureCity} to ${bus!.arrivalCity} is confirmed (PNR: ${newBooking.pnr}).`,
        'booking'
      );

      setLoading(false);
      showToast('Payment Successful! Ticket Confirmed.', { type: 'success' });

      // 4. Navigate to ticket confirmation
      router.replace({
        pathname: '/ticket-confirmation',
        params: { bookingId: newBooking.id },
      });
    } catch (err) {
      setLoading(false);
      showToast('Payment simulation encountered an error. Please try again.', { type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <TripzoHeader title="Checkout & Payment" subtitle="Safe & Secure Demo Checkout" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Price Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fare Breakdown</Text>

          <View style={styles.fareRow}>
            <Text style={styles.fareItem}>Ticket Base Fare ({params.seats ? JSON.parse(params.seats).length : 1} seats)</Text>
            <Text style={styles.fareValue}>₹{baseFare}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareItem}>Convenience Fee & Taxes</Text>
            <Text style={styles.fareValue}>₹{convenienceFee}</Text>
          </View>

          {appliedCoupon && (
            <View style={styles.fareRow}>
              <View style={styles.couponTagRow}>
                <Ionicons name="pricetag" size={12} color={Colors.success} />
                <Text style={styles.couponSavings}>Coupon ({appliedCoupon.code})</Text>
              </View>
              <Text style={[styles.fareValue, { color: Colors.success }]}>
                -₹{appliedCoupon.discount}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>Total Payable Amount</Text>
            <Text style={styles.finalValue}>₹{finalAmount}</Text>
          </View>
        </View>

        {/* Coupon System */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Offers & Promo Code</Text>
          <Text style={styles.cardSubtitle}>Apply coupons for instant fare discounts</Text>

          {appliedCoupon ? (
            <View style={styles.appliedBox}>
              <View style={styles.appliedLeft}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <View>
                  <Text style={styles.appliedCode}>{appliedCoupon.code} APPLIED</Text>
                  <Text style={styles.appliedSavings}>You saved ₹{appliedCoupon.discount}!</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputWrapper}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon (e.g. TRIPZO10)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => handleApplyCoupon()}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Clickable Coupons */}
          {!appliedCoupon && (
            <View style={styles.availableCoupons}>
              <Text style={styles.quickCouponsTitle}>TAP TO APPLY DEMO COUPONS:</Text>
              {[
                { code: 'TRIPZO10', desc: '10% OFF up to ₹250' },
                { code: 'WELCOME100', desc: 'Flat ₹100 OFF' },
                { code: 'WEEKEND15', desc: '15% OFF on Weekends' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={styles.quickCouponPill}
                  onPress={() => handleApplyCoupon(c.code)}
                >
                  <Text style={styles.quickCouponCode}>{c.code}</Text>
                  <Text style={styles.quickCouponDesc}>{c.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Payment Method</Text>
          <Text style={styles.cardSubtitle}>All transactions are 100% demo simulated</Text>

          {[
            { id: 'upi', name: 'UPI (GPay / PhonePe / Paytm)', icon: 'qrcode-scan' },
            { id: 'card', name: 'Credit / Debit Card', icon: 'credit-card-outline' },
            { id: 'wallet', name: 'Tripzo Wallet & PayLater', icon: 'wallet-outline' },
            { id: 'netbanking', name: 'Net Banking (All Indian Banks)', icon: 'bank' },
          ].map((item) => {
            const isSelected = paymentMethod === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.methodItem, isSelected && styles.methodItemSelected]}
                onPress={() => setPaymentMethod(item.id as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.methodIconBox, isSelected && styles.methodIconBoxSelected]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={isSelected ? Colors.white : Colors.navy}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text style={[styles.methodName, isSelected && styles.methodNameSelected]}>
                    {item.name}
                  </Text>
                  {isSelected && item.id === 'upi' && (
                    <Text style={styles.methodHint}>Instant verification via {upiId}</Text>
                  )}
                  {isSelected && item.id === 'card' && (
                    <Text style={styles.methodHint}>Demo Visa card ({cardNumber})</Text>
                  )}
                </View>

                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Assurance */}
        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={14} color={Colors.success} />
          <Text style={styles.securityText}>
            256-Bit Encrypted Simulated Checkout. No actual money is debited.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Payment CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.finalTotalLabel}>Grand Total</Text>
          <Text style={styles.finalTotalAmount}>₹{finalAmount}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay ₹{finalAmount}</Text>
              <Ionicons name="shield-checkmark" size={16} color={Colors.white} />
            </>
          )}
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
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fareItem: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fareValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  couponTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponSavings: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  finalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.orangeHover,
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    height: 48,
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  applyBtn: {
    backgroundColor: Colors.navy,
    height: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  appliedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  appliedSavings: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
  },
  removeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  availableCoupons: {
    marginTop: 12,
    gap: 6,
  },
  quickCouponsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickCouponPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickCouponCode: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navy,
  },
  quickCouponDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  methodItemSelected: {
    borderColor: Colors.navy,
    backgroundColor: '#F8FAFC',
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconBoxSelected: {
    backgroundColor: Colors.navy,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  methodNameSelected: {
    color: Colors.navy,
  },
  methodHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.navy,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  finalTotalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  finalTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  payButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    gap: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
