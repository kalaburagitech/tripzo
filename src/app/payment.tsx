import React, { useEffect, useState } from 'react';
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
import { bookingService } from '../services/bookingService';
import { api, convexClient, errorMessage } from '../services/convexClient';
import { session } from '../services/session';
import { LocationPoint, Passenger } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Quote = {
  baseFare: number;
  discountAmount: number;
  convenienceFee: number;
  taxAmount: number;
  totalAmount: number;
  coupon: { code: string; title: string } | null;
  couponMessage?: string;
};

export default function PaymentScreen() {
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
    boardingPoint: string;
    droppingPoint: string;
  }>();

  const seatNumbers: string[] = params.seats ? JSON.parse(params.seats) : [];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'netbanking'>('upi');
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const cardNumber = '4532 •••• •••• 8910';
  const upiId = 'traveler@okhdfcbank';

  // Server-authoritative fare quote (includes GST + convenience fee + coupon)
  const fetchQuote = async (code?: string): Promise<Quote | null> => {
    const token = await session.load();
    const q = await convexClient.query(api.bookings.quoteFare, {
      tripId: params.busId as any,
      seatNumbers,
      couponCode: code,
      token: token ?? undefined,
    });
    return q as Quote | null;
  };

  useEffect(() => {
    fetchQuote()
      .then((q) => {
        if (q) setQuote(q);
        else showToast('This trip is no longer available.', { type: 'error' });
      })
      .catch((err) => showToast(errorMessage(err), { type: 'error' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.busId, params.seats]);

  const baseFare = quote?.baseFare ?? parseInt(params.totalFare || '0', 10);
  const convenienceFee = quote?.convenienceFee ?? 0;
  const taxAmount = quote?.taxAmount ?? 0;
  const appliedCoupon = quote?.coupon ? { ...quote.coupon, discount: quote.discountAmount } : null;
  const finalAmount = quote?.totalAmount ?? 0;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      showToast('Please enter a coupon code', { type: 'warning' });
      return;
    }
    setApplying(true);
    try {
      const q = await fetchQuote(code);
      if (q?.coupon) {
        setQuote(q);
        setCouponCode(q.coupon.code);
        showToast(q.couponMessage || 'Coupon applied!', { type: 'success' });
      } else {
        showToast(q?.couponMessage || 'Invalid coupon code.', { type: 'error' });
      }
    } catch (err) {
      showToast(errorMessage(err), { type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponCode('');
    try {
      const q = await fetchQuote();
      if (q) setQuote(q);
    } catch {}
    showToast('Coupon removed', { type: 'info' });
  };

  const handlePayNow = async () => {
    if (!quote) {
      showToast('Fetching latest fare, please wait…', { type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const passengers: Passenger[] = JSON.parse(params.passengers);
      const boardingPoint: LocationPoint = JSON.parse(params.boardingPoint);
      const droppingPoint: LocationPoint = JSON.parse(params.droppingPoint);

      const res = await bookingService.createBooking({
        tripId: params.busId,
        seatNumbers,
        passengers,
        boardingPoint,
        droppingPoint,
        contactPhone: params.phone,
        contactEmail: params.email,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        expectedTotal: quote.totalAmount,
      });

      setLoading(false);
      showToast(`Payment Successful! PNR ${res.pnr}`, { type: 'success' });
      router.replace({
        pathname: '/ticket-confirmation',
        params: { bookingId: res.bookingId },
      });
    } catch (err) {
      setLoading(false);
      showToast(errorMessage(err), { type: 'error' });
      // Fare may have changed on the server; refresh the quote
      fetchQuote(appliedCoupon?.code).then((q) => q && setQuote(q)).catch(() => {});
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
            <Text style={styles.fareItem}>Ticket Base Fare ({seatNumbers.length} seats)</Text>
            <Text style={styles.fareValue}>₹{baseFare}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareItem}>Convenience Fee</Text>
            <Text style={styles.fareValue}>₹{convenienceFee}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareItem}>GST (5%)</Text>
            <Text style={styles.fareValue}>₹{taxAmount}</Text>
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
                disabled={applying}
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
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.finalTotalLabel}>Grand Total</Text>
          <Text style={styles.finalTotalAmount}>₹{finalAmount}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={loading || !quote}
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
