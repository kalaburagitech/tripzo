import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 700 });

    textTranslateY.value = withSequence(
      withTiming(30, { duration: 300 }),
      withSpring(0, { damping: 14 })
    );
    textOpacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 600 })
    );

    const timer = setTimeout(async () => {
      const onboarded = await authService.isOnboarded();
      if (!onboarded) {
        router.replace('/onboarding');
      } else {
        const user = await authService.getProfile();
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/login');
        }
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.glowCircle} />

      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/images/tripzo-logo.jpg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View style={[styles.brandContainer, textAnimatedStyle]}>
          <Text style={styles.brandTitle}>Tripzo</Text>
          <View style={styles.taglineBadge}>
            <Text style={styles.tagline}>Your Journey, Your Way</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PREMIUM INTERCITY BUS TRAVEL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: '#1E2C4F',
    opacity: 0.35,
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 117, 71, 0.4)',
    elevation: 12,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    backgroundColor: Colors.white,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  taglineBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 117, 71, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 117, 71, 0.3)',
  },
  tagline: {
    fontSize: 14,
    color: Colors.orange,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
