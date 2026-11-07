import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { authService } from '../../services/authService';
import { useToast } from '../../components/Toast';
import { TripzoHeader } from '../../components/TripzoHeader';

export default function SignupScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loading, setLoading] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSignup = async () => {
    if (!name.trim()) {
      showToast('Please enter your full name', { type: 'error' });
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 10) {
      showToast('Please enter a valid 10-digit mobile number', { type: 'error' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address', { type: 'error' });
      return;
    }

    setLoading(true);
    if (!otpSent) {
      const sent = await authService.sendOtp(phone);
      setLoading(false);
      if (!sent.success) {
        showToast(sent.message, { type: 'error' });
        return;
      }
      setOtpSent(true);
      showToast(sent.demoOtp ? `Demo mode: your OTP is ${sent.demoOtp}` : 'OTP sent to your mobile', {
        type: 'info',
      });
      return;
    }

    const res = await authService.verifyOtp(phone, otp.trim(), {
      name: name.trim(),
      email: email.trim(),
      gender,
    });
    setLoading(false);

    if (res.success) {
      showToast('Account created successfully!', { type: 'success' });
      router.replace('/(tabs)');
    } else {
      showToast(res.message, { type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TripzoHeader title="Create Account" subtitle="Join Tripzo Travelers" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <Text style={styles.cardSubtitle}>
            Save your details once for 1-tap bookings and digital tickets.
          </Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. rahul@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.genderPill, gender === item.id && styles.genderPillActive]}
                  onPress={() => setGender(item.id as any)}
                >
                  <Text
                    style={[styles.genderText, gender === item.id && styles.genderTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {otpSent && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter 6-digit OTP sent to +91 {phone}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Please wait…' : otpSent ? 'Verify & Create Account' : 'Send OTP'}
            </Text>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 20,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
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
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  genderPillActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  genderTextActive: {
    color: Colors.white,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginTop: 10,
    gap: 8,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
