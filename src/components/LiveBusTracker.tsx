import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Booking } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from './Toast';

interface LiveBusTrackerProps {
  booking: Booking;
}

export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ booking }) => {
  const { showToast } = useToast();
  const [reminderSet, setReminderSet] = useState(false);
  const [speed, setSpeed] = useState(68);
  const [nextStopEta, setNextStopEta] = useState(24);

  // Animated pulse for bus position
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);

    // Simulate slight speed fluctuations
    const timer = setInterval(() => {
      setSpeed(Math.floor(62 + Math.random() * 12));
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.25]);
    const opacity = interpolate(pulse.value, [0, 1], [0.8, 0.2]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const toggleReminder = () => {
    setReminderSet(!reminderSet);
    if (!reminderSet) {
      showToast('Boarding reminder activated! You will receive alert 30m before departure.', {
        type: 'success',
      });
    } else {
      showToast('Boarding reminder turned off.', { type: 'info' });
    }
  };

  const stops = [
    { name: booking.boardingPoint.name, time: booking.boardingPoint.time, status: 'completed' },
    { name: 'Midway Highway Plaza / Rest Stop', time: '01:30', status: 'current' },
    { name: 'City Toll Gate Checkpoint', time: '04:45', status: 'upcoming' },
    { name: booking.droppingPoint.name, time: booking.bus.arrivalTime, status: 'upcoming' },
  ];

  return (
    <View style={styles.container}>
      {/* Simulation Notice Banner */}
      <View style={styles.noticeBanner}>
        <Ionicons name="information-circle" size={16} color={Colors.orange} />
        <Text style={styles.noticeText}>DEMO SIMULATION: Live GPS bus movement is simulated.</Text>
      </View>

      {/* Live Status Header */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.greenDot} />
            <Text style={styles.liveText}>ON SCHEDULE</Text>
          </View>

          <View style={styles.speedBadge}>
            <MaterialCommunityIcons name="speedometer" size={14} color={Colors.navy} />
            <Text style={styles.speedText}>{speed} km/h</Text>
          </View>
        </View>

        <Text style={styles.mainEta}>Arriving in ~{booking.bus.duration}</Text>
        <Text style={styles.nextStopDesc}>
          Next Stop: <Text style={{ fontWeight: '700', color: Colors.navy }}>Midway Highway Plaza</Text> (~{nextStopEta} mins)
        </Text>
      </View>

      {/* Animated Route Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>ROUTE TIMELINE & PROGRESS</Text>

        <View style={styles.stopsList}>
          {stops.map((stop, index) => {
            const isCompleted = stop.status === 'completed';
            const isCurrent = stop.status === 'current';
            const isLast = index === stops.length - 1;

            return (
              <View key={index} style={styles.stopRow}>
                {/* Time */}
                <View style={styles.timeCol}>
                  <Text style={[styles.stopTime, isCurrent && styles.stopTimeCurrent]}>
                    {stop.time}
                  </Text>
                </View>

                {/* Node & Connecting Line */}
                <View style={styles.nodeCol}>
                  {isCurrent ? (
                    <View style={styles.currentBusMarker}>
                      <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                      <View style={styles.busIconCircle}>
                        <MaterialCommunityIcons name="bus" size={14} color={Colors.white} />
                      </View>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.standardDot,
                        isCompleted && { backgroundColor: Colors.success, borderColor: Colors.success },
                      ]}
                    >
                      {isCompleted && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                    </View>
                  )}

                  {!isLast && (
                    <View
                      style={[
                        styles.connectorLine,
                        isCompleted && { backgroundColor: Colors.success },
                      ]}
                    />
                  )}
                </View>

                {/* Stop Description */}
                <View style={styles.descCol}>
                  <Text style={[styles.stopName, isCurrent && styles.stopNameCurrent]}>
                    {stop.name}
                  </Text>
                  {isCurrent && (
                    <View style={styles.currentLocationBadge}>
                      <Text style={styles.currentBadgeText}>Bus is here right now</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Driver & Bus Info */}
      <View style={styles.driverCard}>
        <View style={styles.driverLeft}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={22} color={Colors.navy} />
          </View>
          <View>
            <Text style={styles.driverName}>Driver: Ramesh Gowda</Text>
            <Text style={styles.busPlate}>Vehicle: KA 01 AK 9876</Text>
            <Text style={styles.busTypeDesc}>{booking.bus.operatorName} • {booking.bus.busType}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callDriverBtn}
          onPress={() => showToast('Calling driver... (Demo)', { type: 'info' })}
        >
          <Ionicons name="call" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Reminder Toggle Button */}
      <TouchableOpacity
        style={[styles.reminderBtn, reminderSet && styles.reminderBtnActive]}
        onPress={toggleReminder}
      >
        <Ionicons
          name={reminderSet ? 'notifications' : 'notifications-outline'}
          size={18}
          color={reminderSet ? Colors.white : Colors.navy}
        />
        <Text style={[styles.reminderBtnText, reminderSet && { color: Colors.white }]}>
          {reminderSet ? 'Boarding Reminder Enabled' : 'Set Boarding Reminder'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: 6,
  },
  noticeText: {
    fontSize: 11,
    color: '#9A3412',
    fontWeight: '600',
    flex: 1,
  },
  statusCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    gap: 4,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  mainEta: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 10,
  },
  nextStopDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timelineCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stopsList: {
    paddingLeft: 4,
  },
  stopRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timeCol: {
    width: 50,
  },
  stopTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stopTimeCurrent: {
    color: Colors.orange,
    fontWeight: '800',
  },
  nodeCol: {
    width: 32,
    alignItems: 'center',
  },
  standardDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  currentBusMarker: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  pulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.orange,
  },
  busIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  descCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  stopName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  stopNameCurrent: {
    color: Colors.navy,
    fontWeight: '800',
  },
  currentLocationBadge: {
    backgroundColor: Colors.orangeLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    color: Colors.orangeHover,
    fontWeight: '700',
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  busPlate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  busTypeDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callDriverBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.navy,
    gap: 8,
  },
  reminderBtnActive: {
    backgroundColor: Colors.navy,
  },
  reminderBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
});
