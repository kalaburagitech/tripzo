import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { POPULAR_ROUTES, WEEKEND_DESTINATIONS, PROMOTIONAL_BANNERS } from '../../data/dummyData';
import { authService } from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import { UserProfile, RouteSearch } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarModal } from '../../components/CalendarModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [fromCity, setFromCity] = useState('Bengaluru');
  const [toCity, setToCity] = useState('Hyderabad');
  const todayIso = new Date().toISOString().split('T')[0];
  const [journeyDate, setJourneyDate] = useState<string>(todayIso);
  const [selectedDateOption, setSelectedDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [recentSearches, setRecentSearches] = useState<RouteSearch[]>([]);

  const loadUserData = async () => {
    const profile = await authService.getProfile();
    setUser(profile);
    const recents = await bookingService.getRecentSearches();
    setRecentSearches(recents);
  };

  useEffect(() => {
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserData();
  }, []);

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const getQuickDateIso = (type: 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (iso: string) => {
    try {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  const handleSelectQuickDate = (type: 'today' | 'tomorrow') => {
    const dateStr = getQuickDateIso(type);
    setJourneyDate(dateStr);
    setSelectedDateOption(type);
  };

  const handleCalendarSelect = (dateStr: string) => {
    setJourneyDate(dateStr);
    if (dateStr === todayIso) {
      setSelectedDateOption('today');
    } else if (dateStr === getQuickDateIso('tomorrow')) {
      setSelectedDateOption('tomorrow');
    } else {
      setSelectedDateOption('custom');
    }
  };

  const handleSearchBuses = async () => {
    const searchData: RouteSearch = {
      fromCity,
      toCity,
      date: journeyDate,
      passengerCount,
    };
    await bookingService.addRecentSearch(searchData);

    router.push({
      pathname: '/bus-results',
      params: {
        from: fromCity,
        to: toCity,
        date: journeyDate,
        passengers: passengerCount.toString(),
      },
    });
  };

  const handleSelectRecent = (s: RouteSearch) => {
    setFromCity(s.fromCity);
    setToCity(s.toCity);
    router.push({
      pathname: '/bus-results',
      params: {
        from: s.fromCity,
        to: s.toCity,
        date: s.date,
        passengers: s.passengerCount.toString(),
      },
    });
  };

  const handlePopularRoute = (route: typeof POPULAR_ROUTES[0]) => {
    setFromCity(route.from);
    setToCity(route.to);
    router.push({
      pathname: '/bus-results',
      params: {
        from: route.from,
        to: route.to,
        date: todayIso,
        passengers: '1',
      },
    });
  };

  const getDestinationImage = (key: string) => {
    switch (key) {
      case 'beach':
        return require('../../../assets/images/beach-travel.jpg');
      case 'mountain':
        return require('../../../assets/images/mountain-travel.jpg');
      case 'city':
      default:
        return require('../../../assets/images/city-travel.jpg');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header Background */}
      <View style={[styles.headerHero, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          <View style={styles.userGreeting}>
            <Text style={styles.greetingSubtitle}>Hello Traveler 👋</Text>
            <Text style={styles.greetingTitle}>
              {user?.name ? user.name.split(' ')[0] : 'Explore India'}
            </Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.white} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.push('/support')}
            >
              <Ionicons name="help-buoy-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.heroTagline}>Where would you like to travel today?</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Card Container */}
        <View style={styles.searchCard}>
          {/* From City */}
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() =>
              router.push({
                pathname: '/search',
                params: {
                  type: 'from',
                  currentCity: fromCity,
                  onSelectRoute: 'home',
                },
              })
            }
          >
            <View style={styles.cityIconBox}>
              <MaterialCommunityIcons name="bus-side" size={20} color={Colors.orange} />
            </View>
            <View style={styles.cityTextContainer}>
              <Text style={styles.cityLabel}>FROM</Text>
              <Text style={styles.cityName}>{fromCity}</Text>
            </View>
          </TouchableOpacity>

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapButton} onPress={swapCities} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* To City */}
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() =>
              router.push({
                pathname: '/search',
                params: {
                  type: 'to',
                  currentCity: toCity,
                  onSelectRoute: 'home',
                },
              })
            }
          >
            <View style={styles.cityIconBox}>
              <Ionicons name="location" size={20} color={Colors.navy} />
            </View>
            <View style={styles.cityTextContainer}>
              <Text style={styles.cityLabel}>TO</Text>
              <Text style={styles.cityName}>{toCity}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Date Picker Row */}
          <View style={styles.dateSelectorContainer}>
            <View style={styles.dateHeaderRow}>
              <Text style={styles.sectionSmallLabel}>JOURNEY DATE</Text>
              <TouchableOpacity
                style={styles.calendarLinkBtn}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Ionicons name="calendar" size={14} color={Colors.orange} />
                <Text style={styles.calendarLinkText}>Open Calendar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateButtonsRow}>
              {/* Today */}
              <TouchableOpacity
                style={[
                  styles.datePill,
                  selectedDateOption === 'today' && styles.datePillActive,
                ]}
                onPress={() => handleSelectQuickDate('today')}
              >
                <Text
                  style={[
                    styles.datePillTitle,
                    selectedDateOption === 'today' && styles.datePillTitleActive,
                  ]}
                >
                  Today
                </Text>
                <Text
                  style={[
                    styles.datePillDate,
                    selectedDateOption === 'today' && styles.datePillDateActive,
                  ]}
                >
                  {formatDisplayDate(getQuickDateIso('today'))}
                </Text>
              </TouchableOpacity>

              {/* Tomorrow */}
              <TouchableOpacity
                style={[
                  styles.datePill,
                  selectedDateOption === 'tomorrow' && styles.datePillActive,
                ]}
                onPress={() => handleSelectQuickDate('tomorrow')}
              >
                <Text
                  style={[
                    styles.datePillTitle,
                    selectedDateOption === 'tomorrow' && styles.datePillTitleActive,
                  ]}
                >
                  Tomorrow
                </Text>
                <Text
                  style={[
                    styles.datePillDate,
                    selectedDateOption === 'tomorrow' && styles.datePillDateActive,
                  ]}
                >
                  {formatDisplayDate(getQuickDateIso('tomorrow'))}
                </Text>
              </TouchableOpacity>

              {/* Pick / Custom Date */}
              <TouchableOpacity
                style={[
                  styles.datePill,
                  styles.calendarDatePill,
                  selectedDateOption === 'custom' && styles.datePillActive,
                ]}
                onPress={() => setIsCalendarOpen(true)}
              >
                <View style={styles.customPillHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={selectedDateOption === 'custom' ? Colors.orangeHover : Colors.navy}
                  />
                  <Text
                    style={[
                      styles.datePillTitle,
                      selectedDateOption === 'custom' && styles.datePillTitleActive,
                    ]}
                  >
                    Custom
                  </Text>
                </View>
                <Text
                  style={[
                    styles.datePillDate,
                    selectedDateOption === 'custom' && styles.datePillDateActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedDateOption === 'custom'
                    ? formatDisplayDate(journeyDate)
                    : 'Pick Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Passenger Selector */}
          <View style={styles.passengerRow}>
            <View>
              <Text style={styles.sectionSmallLabel}>TRAVELERS</Text>
              <Text style={styles.passengerCountText}>
                {passengerCount} Passenger{passengerCount > 1 ? 's' : ''} (Max 6)
              </Text>
            </View>

            <View style={styles.counterControl}>
              <TouchableOpacity
                style={[styles.counterBtn, passengerCount <= 1 && styles.counterBtnDisabled]}
                onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                disabled={passengerCount <= 1}
              >
                <Ionicons name="remove" size={16} color={passengerCount <= 1 ? '#94A3B8' : Colors.navy} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{passengerCount}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, passengerCount >= 6 && styles.counterBtnDisabled]}
                onPress={() => setPassengerCount(Math.min(6, passengerCount + 1))}
                disabled={passengerCount >= 6}
              >
                <Ionicons name="add" size={16} color={passengerCount >= 6 ? '#94A3B8' : Colors.navy} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchBuses}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>SEARCH BUSES</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Recently Searched Routes */}
        {recentSearches.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Recently Searched</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentsScroll}>
              {recentSearches.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentCard}
                  onPress={() => handleSelectRecent(s)}
                >
                  <View style={styles.recentRoute}>
                    <Text style={styles.recentCity}>{s.fromCity}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Colors.orange} />
                    <Text style={styles.recentCity}>{s.toCity}</Text>
                  </View>
                  <Text style={styles.recentDate}>Tap to search buses</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promotional Offers Carousel */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.blockTitle}>Exclusive Deals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/offers')}>
              <Text style={styles.viewAllText}>View All Offers</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            {PROMOTIONAL_BANNERS.map((banner) => (
              <View
                key={banner.id}
                style={[styles.bannerCard, { backgroundColor: banner.bgGradient[0] }]}
              >
                <View style={styles.bannerTag}>
                  <Text style={styles.bannerTagText}>{banner.tag}</Text>
                </View>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerDesc}>{banner.description}</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>Code: {banner.code}</Text>
                  <TouchableOpacity
                    style={styles.applySmallBtn}
                    onPress={() => router.push('/(tabs)/offers')}
                  >
                    <Text style={styles.applySmallText}>View Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Intercity Routes */}
        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Popular Bus Routes</Text>
          <View style={styles.popularGrid}>
            {POPULAR_ROUTES.slice(0, 6).map((route, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.popularCard}
                onPress={() => handlePopularRoute(route)}
                activeOpacity={0.7}
              >
                <View style={styles.popularCities}>
                  <Text style={styles.popularFrom}>{route.from}</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.orange} />
                  <Text style={styles.popularTo}>{route.to}</Text>
                </View>
                <View style={styles.popularDetails}>
                  <Text style={styles.popularDuration}>{route.duration} • {route.busesCount} Buses</Text>
                  <Text style={styles.popularPrice}>From ₹{route.startingPrice}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekend Getaways */}
        <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
          <Text style={styles.blockTitle}>Weekend Getaways</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekendScroll}>
            {WEEKEND_DESTINATIONS.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.getawayCard}
                onPress={() => {
                  setToCity(dest.city);
                  router.push({
                    pathname: '/bus-results',
                    params: {
                      from: fromCity,
                      to: dest.city,
                      date: todayIso,
                      passengers: '1',
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={getDestinationImage(dest.imageKey)}
                  style={styles.getawayImage}
                  resizeMode="cover"
                />
                <View style={styles.getawayInfo}>
                  <View style={styles.getawayTag}>
                    <Text style={styles.getawayTagText}>{dest.tag}</Text>
                  </View>
                  <Text style={styles.getawayTitle}>{dest.city}</Text>
                  <Text style={styles.getawaySubtitle}>{dest.title}</Text>
                  <Text style={styles.getawayDistance}>{dest.distance} • Overnight Buses</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Interactive Journey Date Calendar Modal */}
      <CalendarModal
        visible={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={journeyDate}
        onSelectDate={handleCalendarSelect}
        minDate={todayIso}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerHero: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userGreeting: {},
  greetingSubtitle: {
    fontSize: 12,
    color: Colors.orange,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  heroTagline: {
    fontSize: 15,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  searchCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 18,
    ...Shadows.lg,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cityIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cityTextContainer: {
    flex: 1,
  },
  cityLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cityName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 2,
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  sectionSmallLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dateSelectorContainer: {},
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  calendarLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  calendarDatePill: {
    borderStyle: 'dashed',
  },
  customPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  datePillActive: {
    backgroundColor: Colors.orangeLight,
    borderColor: Colors.orange,
  },
  datePillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  datePillTitleActive: {
    color: Colors.orangeHover,
  },
  datePillDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  datePillDateActive: {
    color: Colors.orangeHover,
    fontWeight: '600',
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
    marginTop: 2,
  },
  counterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy,
    minWidth: 16,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: 16,
    gap: 8,
    ...Shadows.md,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionBlock: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orange,
  },
  recentsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recentCard: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  recentRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentCity: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  recentDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
  },
  offersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: width * 0.75,
    padding: 16,
    borderRadius: Radii.lg,
    marginRight: 12,
    ...Shadows.sm,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    marginBottom: 8,
  },
  bannerTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  bannerDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  codeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  applySmallBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  applySmallText: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: '800',
  },
  popularGrid: {
    gap: 10,
  },
  popularCard: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  popularCities: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularFrom: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  popularTo: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  popularDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  popularDuration: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  popularPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.orange,
  },
  weekendScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  getawayCard: {
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  getawayImage: {
    width: '100%',
    height: 120,
  },
  getawayInfo: {
    padding: 12,
  },
  getawayTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.orangeLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    marginBottom: 4,
  },
  getawayTagText: {
    color: Colors.orangeHover,
    fontSize: 9,
    fontWeight: '700',
  },
  getawayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  getawaySubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  getawayDistance: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
