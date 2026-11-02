import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TripzoHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  theme?: 'navy' | 'light';
}

export const TripzoHeader: React.FC<TripzoHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightElement,
  theme = 'navy',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isNavy = theme === 'navy';

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: isNavy ? Colors.navy : Colors.white,
          borderBottomColor: isNavy ? 'transparent' : Colors.borderLight,
        },
      ]}
    >
      <StatusBar barStyle={isNavy ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isNavy ? 'rgba(255,255,255,0.12)' : Colors.background }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={isNavy ? Colors.white : Colors.navy} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isNavy ? Colors.white : Colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: isNavy ? Colors.orange : Colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>{rightElement || <View style={styles.placeholder} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  rightContainer: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 38,
  },
});
