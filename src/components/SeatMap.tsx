import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Bus, Seat } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';

interface SeatMapProps {
  bus: Bus;
  selectedSeats: Seat[];
  onToggleSeat: (seat: Seat) => void;
  maxSeats?: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  bus,
  selectedSeats,
  onToggleSeat,
  maxSeats = 6,
}) => {
  const isSleeper = bus.category === 'sleeper' || bus.category === 'semi-sleeper';
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');

  // Generate realistic seats for the bus
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const rows = 6;

    if (isSleeper) {
      // 2 decks: lower and upper. Each row has 1 single sleeper on left (col 0) and 2 sleepers on right (col 2, 3)
      ['lower', 'upper'].forEach((deck) => {
        const prefix = deck === 'lower' ? 'L' : 'U';
        for (let r = 1; r <= rows; r++) {
          // Left single berth
          const s1Num = `${prefix}${r}A`;
          const isBooked1 = (r === 2 && deck === 'lower') || (r === 4 && deck === 'upper');
          const isFemale1 = r === 3 && deck === 'lower';
          seats.push({
            id: `seat-${s1Num}`,
            seatNumber: s1Num,
            deck: deck as 'lower' | 'upper',
            type: 'sleeper',
            status: isBooked1 ? 'booked' : isFemale1 ? 'female_reserved' : 'available',
            price: bus.price + (deck === 'lower' ? 50 : 0),
            row: r,
            col: 0,
            bookedByGender: isFemale1 ? 'female' : undefined,
          });

          // Right double berths
          const s2Num = `${prefix}${r}B`;
          const isBooked2 = (r === 1 && deck === 'lower') || (r === 5 && deck === 'upper');
          seats.push({
            id: `seat-${s2Num}`,
            seatNumber: s2Num,
            deck: deck as 'lower' | 'upper',
            type: 'sleeper',
            status: isBooked2 ? 'booked' : 'available',
            price: bus.price + (deck === 'lower' ? 50 : 0),
            row: r,
            col: 2,
          });

          const s3Num = `${prefix}${r}C`;
          const isBooked3 = r === 6 && deck === 'lower';
          const isFemale3 = r === 2 && deck === 'upper';
          seats.push({
            id: `seat-${s3Num}`,
            seatNumber: s3Num,
            deck: deck as 'lower' | 'upper',
            type: 'sleeper',
            status: isBooked3 ? 'booked' : isFemale3 ? 'female_reserved' : 'available',
            price: bus.price + (deck === 'lower' ? 50 : 0),
            row: r,
            col: 3,
            bookedByGender: isFemale3 ? 'female' : undefined,
          });
        }
      });
    } else {
      // Seater 2+2 layout
      for (let r = 1; r <= 8; r++) {
        ['A', 'B', 'C', 'D'].forEach((colLetter, cIdx) => {
          const seatNum = `${r}${colLetter}`;
          const isBooked = (r === 2 && (cIdx === 0 || cIdx === 1)) || (r === 5 && cIdx === 3);
          const isFemale = r === 1 && (cIdx === 0 || cIdx === 1);
          seats.push({
            id: `seat-${seatNum}`,
            seatNumber: seatNum,
            deck: 'lower',
            type: 'seater',
            status: isBooked ? 'booked' : isFemale ? 'female_reserved' : 'available',
            price: bus.price,
            row: r,
            col: cIdx <= 1 ? cIdx : cIdx + 1, // 0, 1 aisle 3, 4
            bookedByGender: isFemale ? 'female' : undefined,
          });
        });
      }
    }

    return seats;
  };

  const allSeats = generateSeats();
  const currentDeckSeats = isSleeper
    ? allSeats.filter((s) => s.deck === activeDeck)
    : allSeats;

  const isSelected = (seat: Seat) => selectedSeats.some((s) => s.id === seat.id);

  const getSeatColor = (seat: Seat) => {
    if (isSelected(seat)) return Colors.orange;
    if (seat.status === 'booked') return '#CBD5E1';
    if (seat.status === 'female_reserved') return '#F472B6';
    return Colors.white;
  };

  const getSeatBorder = (seat: Seat) => {
    if (isSelected(seat)) return Colors.orange;
    if (seat.status === 'booked') return '#94A3B8';
    if (seat.status === 'female_reserved') return '#EC4899';
    return '#94A3B8';
  };

  const renderSeatItem = (seat: Seat) => {
    const selected = isSelected(seat);
    const booked = seat.status === 'booked';
    const isFemale = seat.status === 'female_reserved';

    const width = isSleeper ? (seat.col === 0 ? 56 : 52) : 44;
    const height = isSleeper ? 82 : 46;

    return (
      <TouchableOpacity
        key={seat.id}
        style={[
          styles.seatBox,
          {
            width,
            height,
            backgroundColor: getSeatColor(seat),
            borderColor: getSeatBorder(seat),
          },
        ]}
        disabled={booked}
        onPress={() => onToggleSeat(seat)}
        activeOpacity={0.7}
      >
        {/* Pillow area for sleeper berth */}
        {isSleeper && (
          <View
            style={[
              styles.pillow,
              {
                backgroundColor: selected
                  ? '#EA580C'
                  : booked
                  ? '#94A3B8'
                  : isFemale
                  ? '#DB2777'
                  : '#E2E8F0',
              },
            ]}
          />
        )}

        <Text
          style={[
            styles.seatNumber,
            {
              color: selected || booked || isFemale ? Colors.white : Colors.navy,
              fontWeight: selected ? '800' : '600',
            },
          ]}
        >
          {seat.seatNumber}
        </Text>

        <Text
          style={[
            styles.seatPrice,
            { color: selected || booked || isFemale ? Colors.white : Colors.textSecondary },
          ]}
        >
          ₹{seat.price}
        </Text>

        {isFemale && !booked && !selected && (
          <Ionicons name="woman" size={10} color={Colors.white} style={styles.femaleIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Deck Selector Tabs if Sleeper */}
      {isSleeper && (
        <View style={styles.deckTabs}>
          <TouchableOpacity
            style={[styles.deckTab, activeDeck === 'lower' && styles.deckTabActive]}
            onPress={() => setActiveDeck('lower')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bunk-bed-outline"
              size={18}
              color={activeDeck === 'lower' ? Colors.white : Colors.navy}
            />
            <Text style={[styles.deckTabText, activeDeck === 'lower' && styles.deckTabTextActive]}>
              Lower Berth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deckTab, activeDeck === 'upper' && styles.deckTabActive]}
            onPress={() => setActiveDeck('upper')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bunk-bed"
              size={18}
              color={activeDeck === 'upper' ? Colors.white : Colors.navy}
            />
            <Text style={[styles.deckTabText, activeDeck === 'upper' && styles.deckTabTextActive]}>
              Upper Berth
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bus Layout Container */}
      <View style={styles.busChassis}>
        {/* Front Driver Cabin Indicator */}
        <View style={styles.frontCabin}>
          <View style={styles.driverSection}>
            <MaterialCommunityIcons name="steering" size={24} color={Colors.navy} />
            <Text style={styles.driverText}>Front</Text>
          </View>
          <View style={styles.entranceDoor}>
            <Text style={styles.doorText}>Gate</Text>
            <Ionicons name="enter-outline" size={16} color={Colors.textSecondary} />
          </View>
        </View>

        <View style={styles.dividerLine} />

        {/* Seats Grid */}
        <ScrollView contentContainerStyle={styles.seatsGrid} showsVerticalScrollIndicator={false}>
          {Array.from(new Set(currentDeckSeats.map((s) => s.row))).map((rowNum) => {
            const rowSeats = currentDeckSeats.filter((s) => s.row === rowNum);
            const leftSeats = rowSeats.filter((s) => s.col <= 1);
            const rightSeats = rowSeats.filter((s) => s.col >= 2);

            return (
              <View key={`row-${rowNum}`} style={styles.rowContainer}>
                <View style={styles.leftColContainer}>
                  {leftSeats.map((seat) => renderSeatItem(seat))}
                </View>

                {/* Aisle Space */}
                <View style={styles.aisleSpace}>
                  <Text style={styles.aisleText}>{rowNum}</Text>
                </View>

                <View style={styles.rightColContainer}>
                  {rightSeats.map((seat) => renderSeatItem(seat))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Seat Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: Colors.white, borderColor: '#94A3B8' }]} />
          <Text style={styles.legendLabel}>Available</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: Colors.orange, borderColor: Colors.orange }]} />
          <Text style={styles.legendLabel}>Selected</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#F472B6', borderColor: '#EC4899' }]} />
          <Text style={styles.legendLabel}>Female</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#CBD5E1', borderColor: '#94A3B8' }]} />
          <Text style={styles.legendLabel}>Booked</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  deckTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.pill,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  deckTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.pill,
    gap: 6,
  },
  deckTabActive: {
    backgroundColor: Colors.navy,
  },
  deckTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
  },
  deckTabTextActive: {
    color: Colors.white,
  },
  busChassis: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginHorizontal: 16,
    padding: 16,
    ...Shadows.sm,
  },
  frontCabin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  entranceDoor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    gap: 4,
  },
  doorText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  seatsGrid: {
    gap: 14,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  rightColContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  aisleSpace: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  seatBox: {
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 2,
    ...Shadows.sm,
  },
  pillow: {
    position: 'absolute',
    top: 4,
    width: '70%',
    height: 10,
    borderRadius: 3,
  },
  seatNumber: {
    fontSize: 11,
    marginTop: 6,
  },
  seatPrice: {
    fontSize: 9,
    marginTop: 2,
  },
  femaleIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
