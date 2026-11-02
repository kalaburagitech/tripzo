import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Radii } from '../constants/theme';

export const SkeletonCard: React.FC = () => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Animated.View style={[styles.shimmerBox, { width: 140, height: 18 }, animatedStyle]} />
        <Animated.View style={[styles.shimmerBox, { width: 60, height: 24, borderRadius: Radii.pill }, animatedStyle]} />
      </View>
      <View style={{ marginVertical: 12 }}>
        <Animated.View style={[styles.shimmerBox, { width: 200, height: 12, marginBottom: 8 }, animatedStyle]} />
        <Animated.View style={[styles.shimmerBox, { width: '100%', height: 40, borderRadius: Radii.md }, animatedStyle]} />
      </View>
      <View style={styles.footerRow}>
        <Animated.View style={[styles.shimmerBox, { width: 80, height: 20 }, animatedStyle]} />
        <Animated.View style={[styles.shimmerBox, { width: 110, height: 36, borderRadius: Radii.md }, animatedStyle]} />
      </View>
    </View>
  );
};

export const BusListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shimmerBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: Radii.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
