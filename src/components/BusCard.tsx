import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Bus } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';

interface BusCardProps {
  bus: Bus;
  onSelectSeats: (bus: Bus) => void;
  onViewDetails?: (bus: Bus) => void;
}

export const BusCard: React.FC<BusCardProps> = ({ bus, onSelectSeats, onViewDetails }) => {
  const isLowSeats = bus.availableSeats <= 10;

  return (
    <View style={styles.card}>
      {/* Top Bar: Operator Name, Category & Rating */}
      <View style={styles.topRow}>
        <View style={styles.operatorInfo}>
          <Text style={styles.operatorName} numberOfLines={1}>
            {bus.operatorName}
          </Text>
          <Text style={styles.busType} numberOfLines={1}>
            {bus.busType}
          </Text>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={Colors.white} />
          <Text style={styles.ratingText}>{bus.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Journey Timeline */}
      <View style={styles.timelineContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeText}>{bus.departureTime}</Text>
          <Text style={styles.cityText} numberOfLines={1}>
            {bus.departureCity}
          </Text>
        </View>

        <View style={styles.durationBlock}>
          <Text style={styles.durationText}>{bus.duration}</Text>
          <View style={styles.durationLineContainer}>
            <View style={styles.durationDot} />
            <View style={styles.durationLine} />
            <MaterialCommunityIcons name="bus" size={16} color={Colors.orange} style={{ marginHorizontal: 2 }} />
            <View style={styles.durationLine} />
            <View style={[styles.durationDot, { backgroundColor: Colors.orange }]} />
          </View>
          {bus.nextDayArrival && <Text style={styles.nextDayBadge}>Next Day</Text>}
        </View>

        <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
          <Text style={styles.timeText}>{bus.arrivalTime}</Text>
          <Text style={styles.cityText} numberOfLines={1}>
            {bus.arrivalCity}
          </Text>
        </View>
      </View>

      {/* Boarding / Dropping Preview */}
      <View style={styles.stopsPreview}>
        <View style={styles.stopItem}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.stopText} numberOfLines={1}>
            {bus.boardingPoints[0]?.name || 'Pickup Point'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} style={{ marginHorizontal: 6 }} />
        <View style={styles.stopItem}>
          <Ionicons name="flag-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.stopText} numberOfLines={1}>
            {bus.droppingPoints[0]?.name || 'Drop Point'}
          </Text>
        </View>
      </View>

      {/* Bottom Bar: Seats Left, Amenities & Price / CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.seatsAndAmenities}>
          <View style={styles.seatsBadge}>
            <Ionicons
              name="person-outline"
              size={12}
              color={isLowSeats ? '#DC2626' : Colors.textSecondary}
            />
            <Text style={[styles.seatsText, isLowSeats && { color: '#DC2626', fontWeight: '700' }]}>
              {bus.availableSeats} seats left
            </Text>
          </View>

          {/* Quick amenity icons */}
          <View style={styles.amenitiesIcons}>
            {bus.isAC && (
              <MaterialCommunityIcons name="snowflake" size={14} color={Colors.accent} style={styles.amenityIcon} />
            )}
            <MaterialCommunityIcons name="wifi" size={14} color={Colors.textMuted} style={styles.amenityIcon} />
            <MaterialCommunityIcons name="power-plug" size={14} color={Colors.textMuted} style={styles.amenityIcon} />
            {bus.category === 'sleeper' && (
              <MaterialCommunityIcons name="bed-outline" size={14} color={Colors.textMuted} style={styles.amenityIcon} />
            )}
          </View>
        </View>

        <View style={styles.priceAndAction}>
          <View style={styles.priceContainer}>
            {bus.originalPrice && <Text style={styles.originalPrice}>₹{bus.originalPrice}</Text>}
            <Text style={styles.price}>₹{bus.price}</Text>
          </View>

          <TouchableOpacity
            style={styles.selectSeatsButton}
            onPress={() => onSelectSeats(bus)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectSeatsText}>Select Seats</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  operatorInfo: {
    flex: 1,
    marginRight: 10,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  busType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    gap: 3,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
  },
  timeBlock: {
    minWidth: 70,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  cityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  durationBlock: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  durationLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  durationDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.navy,
  },
  durationLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.border,
  },
  nextDayBadge: {
    fontSize: 10,
    color: Colors.orange,
    fontWeight: '600',
    marginTop: 3,
  },
  stopsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  stopText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  seatsAndAmenities: {
    flexDirection: 'column',
    gap: 4,
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amenitiesIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  amenityIcon: {
    marginRight: 2,
  },
  priceAndAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  selectSeatsButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    gap: 4,
  },
  selectSeatsText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
