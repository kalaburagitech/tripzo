import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows } from '../constants/theme';
import { CITIES } from '../data/dummyData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, currentCity } = useLocalSearchParams<{ type: 'from' | 'to'; currentCity: string }>();

  const [query, setQuery] = useState('');

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.state.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectCity = (cityName: string) => {
    // Navigate back to home or bus-results with updated city
    router.back();
    // Use router setParams or push
    router.replace({
      pathname: '/(tabs)',
      params: type === 'from' ? { selectedFrom: cityName } : { selectedTo: cityName },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Select {type === 'from' ? 'Departure' : 'Destination'} City</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search city, e.g. Bengaluru, Hyderabad, Kalaburagi"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Popular Cities Quick Tags */}
      {query.length === 0 && (
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>POPULAR CITIES</Text>
          <View style={styles.tagsContainer}>
            {CITIES.filter((c) => c.popular).map((city) => (
              <TouchableOpacity
                key={city.id}
                style={[
                  styles.cityTag,
                  currentCity === city.name && styles.cityTagCurrent,
                ]}
                onPress={() => handleSelectCity(city.name)}
              >
                <Text
                  style={[
                    styles.tagText,
                    currentCity === city.name && styles.tagTextCurrent,
                  ]}
                >
                  {city.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Cities List */}
      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityItem}
            onPress={() => handleSelectCity(item.name)}
          >
            <View style={styles.cityIcon}>
              <Ionicons name="location-outline" size={18} color={Colors.orange} />
            </View>
            <View style={styles.cityDetails}>
              <Text style={styles.cityName}>{item.name}</Text>
              <Text style={styles.cityState}>{item.state}</Text>
            </View>
            {currentCity === item.name && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.orange} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  popularSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityTag: {
    backgroundColor: Colors.background,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityTagCurrent: {
    backgroundColor: Colors.orangeLight,
    borderColor: Colors.orange,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  tagTextCurrent: {
    color: Colors.orangeHover,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cityIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cityDetails: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cityState: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
