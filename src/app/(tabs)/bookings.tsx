import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../../components/TripzoHeader';
import { DigitalPass } from '../../components/DigitalPass';
import { bookingService } from '../../services/bookingService';
import { Booking } from '../../types';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { useToast } from '../../components/Toast';

export default function BookingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const list = await bookingService.getBookings();
    setBookings(list);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    const res = await bookingService.cancelBooking(cancelModalBooking.id);
    setCancelModalBooking(null);
    if (res.success) {
      showToast(res.message, { type: 'success' });
      loadBookings();
    } else {
      showToast(res.message, { type: 'error' });
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'upcoming';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.container}>
      <TripzoHeader title="My Bookings" showBack={false} />

      {/* Tabs Selector */}
      <View style={styles.tabsStrip}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const count = bookings.filter((b) => b.status === tab.id).length;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.orange} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../../assets/images/empty-booking.jpg')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>
              No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'upcoming'
                ? 'Ready for your next journey? Search and book bus tickets in seconds.'
                : `You don't have any ${activeTab} bus tickets in your history.`}
            </Text>

            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.bookNowBtnText}>Book Bus Tickets</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((b) => (
            <View key={b.id} style={styles.bookingCardItem}>
              {/* Boarding Pass Render */}
              <DigitalPass
                booking={b}
                onLiveTrack={() =>
                  router.push({
                    pathname: '/tracking',
                    params: { bookingId: b.id },
                  })
                }
              />

              {/* Cancellation Option for Upcoming Bookings */}
              {b.status === 'upcoming' && (
                <View style={styles.cancelRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setCancelModalBooking(b)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal visible={!!cancelModalBooking} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.warnIconCircle}>
              <Ionicons name="warning" size={28} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Cancel Ticket Confirmation</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to cancel ticket for PNR{' '}
              <Text style={{ fontWeight: '800', color: Colors.navy }}>
                {cancelModalBooking?.pnr}
              </Text>
              ?
            </Text>

            <View style={styles.refundPreviewBox}>
              <Text style={styles.refundNotice}>
                Approximate Refund: ₹
                {cancelModalBooking ? Math.round(cancelModalBooking.baseFare * 0.8) : 0} (80% Base Fare)
              </Text>
              <Text style={styles.refundTimeline}>
                Demo refund will be processed back to original payment method immediately.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setCancelModalBooking(null)}
              >
                <Text style={styles.modalKeepText}>Keep Ticket</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelConfirmBtn}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalCancelConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
  },
  tabItemActive: {
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
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 40,
  },
  bookingCardItem: {
    marginBottom: 16,
  },
  cancelRow: {
    paddingHorizontal: 20,
    marginTop: -4,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyImage: {
    width: 200,
    height: 180,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  bookNowBtn: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    marginTop: 18,
    gap: 8,
  },
  bookNowBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 27, 53, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 22,
    width: '100%',
    alignItems: 'center',
    ...Shadows.lg,
  },
  warnIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  refundPreviewBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: Radii.md,
    marginVertical: 16,
    width: '100%',
  },
  refundNotice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  refundTimeline: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalKeepBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalKeepText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  modalCancelConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  modalCancelConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
