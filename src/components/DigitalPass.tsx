import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Booking } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from './Toast';

interface DigitalPassProps {
  booking: Booking;
  onLiveTrack?: () => void;
  showTrackButton?: boolean;
}

export const DigitalPass: React.FC<DigitalPassProps> = ({
  booking,
  onLiveTrack,
  showTrackButton = true,
}) => {
  const { showToast } = useToast();

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Tripzo Bus Ticket - PNR: ${booking.pnr}`,
        message: `Tripzo Bus Ticket Confirmed!\nPNR: ${booking.pnr}\nOperator: ${booking.bus.operatorName}\nRoute: ${booking.bus.departureCity} -> ${booking.bus.arrivalCity}\nDate: ${booking.travelDate}\nSeats: ${booking.selectedSeats.join(', ')}\nBoarding: ${booking.boardingPoint.name} at ${booking.boardingPoint.time}\nHappy Journey!`,
      });
    } catch {
      showToast('Could not share ticket', { type: 'error' });
    }
  };

  const handleDownload = () => {
    showToast(`Ticket ${booking.pnr} downloaded to device!`, { type: 'success' });
  };

  const isCancelled = booking.status === 'cancelled';

  return (
    <View style={styles.cardWrapper}>
      {/* Ticket Container */}
      <View style={[styles.ticketContainer, isCancelled && styles.cancelledBorder]}>
        {/* Ticket Header */}
        <View style={[styles.ticketHeader, isCancelled && { backgroundColor: '#475569' }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="bus-side" size={16} color={Colors.orange} />
            </View>
            <Text style={styles.brandTitle}>Tripzo</Text>
            <Text style={styles.brandSubtitle}>Boarding Pass</Text>
          </View>

          <View style={styles.pnrBadge}>
            <Text style={styles.pnrLabel}>PNR</Text>
            <Text style={styles.pnrValue}>{booking.pnr}</Text>
          </View>
        </View>

        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={16} color={Colors.white} />
            <Text style={styles.cancelledText}>
              CANCELLED (Refund: ₹{booking.refundAmount || 0})
            </Text>
          </View>
        )}

        {/* Route Header */}
        <View style={styles.routeSection}>
          <View style={styles.routeCity}>
            <Text style={styles.cityHeading}>{booking.bus.departureCity}</Text>
            <Text style={styles.timeHeading}>{booking.boardingPoint.time}</Text>
          </View>

          <View style={styles.routeArrow}>
            <Text style={styles.durationBadge}>{booking.bus.duration}</Text>
            <View style={styles.arrowLine} />
            <MaterialCommunityIcons name="bus" size={18} color={Colors.orange} />
          </View>

          <View style={[styles.routeCity, { alignItems: 'flex-end' }]}>
            <Text style={styles.cityHeading}>{booking.bus.arrivalCity}</Text>
            <Text style={styles.timeHeading}>{booking.bus.arrivalTime}</Text>
          </View>
        </View>

        {/* Boarding and Dropping Addresses */}
        <View style={styles.pointsSection}>
          <View style={styles.pointRow}>
            <View style={styles.pointDot} />
            <View style={styles.pointInfo}>
              <Text style={styles.pointTitle}>Boarding Point: {booking.boardingPoint.name}</Text>
              <Text style={styles.pointAddress}>{booking.boardingPoint.address}</Text>
            </View>
          </View>

          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: Colors.orange }]} />
            <View style={styles.pointInfo}>
              <Text style={styles.pointTitle}>Dropping Point: {booking.droppingPoint.name}</Text>
              <Text style={styles.pointAddress}>{booking.droppingPoint.address}</Text>
            </View>
          </View>
        </View>

        {/* Perforated Divider */}
        <View style={styles.perforatedLineContainer}>
          <View style={styles.leftCutout} />
          <View style={styles.dashedLine} />
          <View style={styles.rightCutout} />
        </View>

        {/* Passengers & Seats */}
        <View style={styles.passengersSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>TRAVEL DATE</Text>
              <Text style={styles.detailVal}>{booking.travelDate}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>SEATS ({booking.selectedSeats.length})</Text>
              <Text style={[styles.detailVal, { color: Colors.orange }]}>
                {booking.selectedSeats.join(', ')}
              </Text>
            </View>
            <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.detailLabel}>OPERATOR</Text>
              <Text style={styles.detailVal} numberOfLines={1}>
                {booking.bus.operatorName}
              </Text>
            </View>
          </View>

          <View style={styles.passengersList}>
            <Text style={styles.passengerListTitle}>PASSENGER(S)</Text>
            {booking.passengers.map((p, idx) => (
              <View key={p.id || idx} style={styles.passengerItem}>
                <Ionicons name="person" size={12} color={Colors.textSecondary} />
                <Text style={styles.passengerName}>
                  {p.name} ({p.age} yrs, {p.gender.toUpperCase()})
                </Text>
                <Text style={styles.passengerSeat}>Seat {p.seatNumber || booking.selectedSeats[idx]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* QR Code and Total Amount */}
        <View style={styles.qrSection}>
          <View style={styles.qrBox}>
            <QRCode
              value={booking.qrPayload || booking.pnr}
              size={90}
              color={Colors.navy}
              backgroundColor={Colors.white}
            />
          </View>

          <View style={styles.fareSummary}>
            <Text style={styles.fareLabel}>Total Paid Amount</Text>
            <Text style={styles.fareValue}>₹{booking.totalAmount}</Text>
            <Text style={styles.paymentMethod}>Paid via {booking.paymentMethod.toUpperCase()}</Text>
            <Text style={styles.scanNotice}>Scan QR during boarding</Text>
          </View>
        </View>
      </View>

      {/* Ticket Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={16} color={Colors.navy} />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
          <Ionicons name="download-outline" size={16} color={Colors.navy} />
          <Text style={styles.actionBtnText}>Download</Text>
        </TouchableOpacity>

        {showTrackButton && !isCancelled && onLiveTrack && (
          <TouchableOpacity style={[styles.actionBtn, styles.trackBtn]} onPress={onLiveTrack}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={Colors.white} />
            <Text style={styles.trackBtnText}>Live Track</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 10,
    marginHorizontal: 16,
  },
  ticketContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cancelledBorder: {
    borderColor: '#94A3B8',
  },
  ticketHeader: {
    backgroundColor: Colors.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '600',
  },
  pnrBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  pnrLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  pnrValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cancelledBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  cancelledText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  routeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  routeCity: {
    flex: 1,
  },
  cityHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  timeHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.orange,
    marginTop: 2,
  },
  routeArrow: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  durationBadge: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  arrowLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  pointsSection: {
    padding: 14,
    backgroundColor: Colors.white,
    gap: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
    marginTop: 4,
  },
  pointInfo: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  pointAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  perforatedLineContainer: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  leftCutout: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rightCutout: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dashedLine: {
    height: 1,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  passengersSection: {
    padding: 16,
    backgroundColor: Colors.white,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  passengersList: {
    marginTop: 12,
    gap: 6,
  },
  passengerListTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passengerName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  passengerSeat: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '700',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 16,
  },
  qrBox: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  fareSummary: {
    flex: 1,
  },
  fareLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  paymentMethod: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  scanNotice: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    ...Shadows.sm,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
  },
  trackBtn: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  trackBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
