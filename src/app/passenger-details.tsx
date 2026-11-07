import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { busService } from '../services/busService';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import { Bus, Passenger } from '../types';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PassengerDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    busId: string;
    travelDate: string;
    seats: string;
    totalFare: string;
  }>();

  const selectedSeatNumbers: string[] = params.seats ? JSON.parse(params.seats) : [];
  const [bus, setBus] = useState<Bus | null>(null);
  // One passenger entry per selected seat
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    selectedSeatNumbers.map((seatNum, idx) => ({
      id: `p_${idx}`,
      seatNumber: seatNum,
      name: '',
      age: 26,
      gender: 'male',
    }))
  );
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [savedList, setSavedList] = useState<Passenger[]>([]);

  useEffect(() => {
    if (params.busId) {
      busService.getBusById(params.busId).then(setBus);
    }

    // Pre-populate contact info + first passenger from user profile,
    // without overwriting anything the user has already typed.
    authService.getProfile().then((u) => {
      if (!u) return;
      setPhone((cur) => cur || u.phone.replace('+91 ', '').trim());
      setEmail((cur) => cur || u.email);
      setPassengers((prev) => {
        if (prev.length === 0 || prev[0].name) return prev;
        const first = {
          ...prev[0],
          name: u.name,
          age: u.age || prev[0].age,
          gender: u.gender || prev[0].gender,
        };
        return [first, ...prev.slice(1)];
      });
    });

    profileService.getSavedPassengers().then(setSavedList);
  }, [params.busId]);

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const autofillSavedPassenger = (index: number, saved: Passenger) => {
    updatePassenger(index, 'name', saved.name);
    updatePassenger(index, 'age', saved.age);
    updatePassenger(index, 'gender', saved.gender);
    showToast(`Filled details for ${saved.name}`, { type: 'info' });
  };

  const handleProceed = () => {
    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim()) {
        showToast(`Please enter name for passenger on Seat ${passengers[i].seatNumber}`, {
          type: 'error',
        });
        return;
      }
      if (!passengers[i].age || passengers[i].age <= 0 || passengers[i].age > 110) {
        showToast(`Please enter valid age for passenger on Seat ${passengers[i].seatNumber}`, {
          type: 'error',
        });
        return;
      }
    }

    // Validate contact info
    if (phone.trim().length < 10) {
      showToast('Please enter a valid 10-digit mobile number for ticket SMS', { type: 'error' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address for digital ticket delivery', {
        type: 'error',
      });
      return;
    }

    router.push({
      pathname: '/boarding-dropping',
      params: {
        busId: bus!.id,
        travelDate: params.travelDate,
        seats: params.seats,
        totalFare: params.totalFare,
        passengers: JSON.stringify(passengers),
        phone: `+91 ${phone.trim()}`,
        email: email.trim(),
      },
    });
  };

  if (!bus) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TripzoHeader title="Passenger Details" subtitle={`${passengers.length} Traveler(s)`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>
          <Text style={styles.cardSubtitle}>
            Your digital boarding pass & OTP will be sent here
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <View style={styles.phoneInputBox}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="ticket.receiver@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
        </View>

        {/* Passenger Cards Per Selected Seat */}
        {passengers.map((p, idx) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.passengerHeader}>
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>Seat {p.seatNumber}</Text>
              </View>
              <Text style={styles.passengerNumber}>Traveler #{idx + 1}</Text>
            </View>

            {/* Quick autofill from saved passengers */}
            {savedList.length > 0 && (
              <View style={styles.savedQuickRow}>
                <Text style={styles.quickLabel}>Saved:</Text>
                {savedList.map((sp) => (
                  <TouchableOpacity
                    key={sp.id}
                    style={styles.quickPill}
                    onPress={() => autofillSavedPassenger(idx, sp)}
                  >
                    <Text style={styles.quickPillText}>+ {sp.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Passenger Name *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Full name as on ID"
                  value={p.name}
                  onChangeText={(val) => updatePassenger(idx, 'name', val)}
                />
              </View>
            </View>

            {/* Age & Gender in row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { width: 90 }]}>
                <Text style={styles.inputLabel}>Age *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 28"
                    keyboardType="number-pad"
                    maxLength={3}
                    value={p.age ? p.age.toString() : ''}
                    onChangeText={(val) =>
                      updatePassenger(idx, 'age', parseInt(val || '0', 10))
                    }
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.genderRow}>
                  {(['male', 'female'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        p.gender === g && styles.genderBtnActive,
                      ]}
                      onPress={() => updatePassenger(idx, 'gender', g)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          p.gender === g && styles.genderBtnTextActive,
                        ]}
                      >
                        {g === 'male' ? 'Male' : 'Female'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.fareInfo}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>₹{params.totalFare}</Text>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleProceed} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>Select Boarding Point</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    height: 46,
    overflow: 'hidden',
  },
  prefixBox: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seatBadge: {
    backgroundColor: Colors.navy,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  seatBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  passengerNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  savedQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  quickPill: {
    backgroundColor: Colors.orangeLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  quickPillText: {
    fontSize: 11,
    color: Colors.orangeHover,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    height: 46,
  },
  genderBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  genderBtnActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  genderBtnTextActive: {
    color: Colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  fareInfo: {},
  totalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
  },
  nextBtn: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
    gap: 6,
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
