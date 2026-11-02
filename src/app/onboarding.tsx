import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Discover Destinations',
    subtitle:
      'Explore hundreds of intercity bus routes across India with live schedules, best fares, and verified passenger ratings.',
    image: require('../../assets/images/splash-travel.jpg'),
    tag: 'EXPLORE INDIA',
  },
  {
    id: '2',
    title: 'Choose Your Perfect Seat',
    subtitle:
      'Select upper or lower sleeper berths and premium seater options with real-time availability and dedicated female-friendly seats.',
    image: require('../../assets/images/sleeper-bus-banner.jpg'),
    tag: 'COMFORT FIRST',
  },
  {
    id: '3',
    title: 'Travel With Confidence',
    subtitle:
      'Live simulated GPS bus tracking, instant digital boarding passes with QR codes, and hassle-free demo ticket cancellations.',
    image: require('../../assets/images/weekend-getaway.jpg'),
    tag: 'SAFE & RELIABLE',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    await authService.setOnboarded();
    router.replace('/auth/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Tripzo</Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.imageCard}>
              <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
            </View>

            <View style={styles.textContent}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Bottom Navigation: Indicator Dots and Next Button */}
      <View style={styles.bottomBar}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  imageCard: {
    width: width - 40,
    height: height * 0.42,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.navyLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tagBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 117, 71, 0.2)',
    marginBottom: 12,
  },
  tagText: {
    color: Colors.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.orange,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  nextButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    gap: 8,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
