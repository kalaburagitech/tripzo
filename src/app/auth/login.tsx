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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { authService } from '../../services/authService';
import { useToast } from '../../components/Toast';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.trim().length < 10) {
      showToast('Please enter a valid 10-digit mobile number', { type: 'error' });
      return;
    }
    setShowOtpModal(true);
    setOtp('123456'); // Pre-fill or guide user for demo ease
    showToast('Demo OTP generated: 123456', { type: 'info' });
  };

  const handleVerifyOtp = async () => {
    if (otp !== '123456') {
      showToast('Incorrect OTP! Please use demo code 123456', { type: 'error' });
      return;
    }

    setLoading(true);
    const res = await authService.login(phone, otp);
    setLoading(false);

    if (res.success) {
      showToast('Welcome to Tripzo!', { type: 'success' });
      router.replace('/(tabs)');
    } else {
      showToast(res.message, { type: 'error' });
    }
  };

  const handleGuestLogin = async () => {
    await authService.loginAsGuest();
    showToast('Continuing as Guest Traveler', { type: 'info' });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/images/tripzo-logo.jpg')}
              style={styles.logoImg}
            />
          </View>
          <Text style={styles.brandTitle}>Welcome to Tripzo</Text>
          <Text style={styles.brandSubtitle}>Your Journey, Your Way</Text>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          <Text style={styles.cardHeading}>Sign in with Mobile</Text>
          <Text style={styles.cardSubheading}>
            Enter your mobile number to receive a verification OTP
          </Text>

          {/* Demo Callout */}
          <View style={styles.demoCallout}>
            <Ionicons name="sparkles" size={16} color={Colors.orange} />
            <Text style={styles.demoCalloutText}>
              DEMO MODE: Enter any 10-digit number. Use OTP <Text style={{ fontWeight: '800' }}>123456</Text>.
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.codeText}>+91</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter mobile number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* OTP Section (Shown if OTP sent) */}
          {showOtpModal && (
            <View style={styles.otpSection}>
              <View style={styles.otpHeader}>
                <Text style={styles.otpLabel}>Enter 6-Digit OTP</Text>
                <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                  <Text style={styles.changePhoneText}>Change number</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Text style={styles.otpHint}>Demo OTP: 123456</Text>
            </View>
          )}

          {/* Primary Action Button */}
          {!showOtpModal ? (
            <TouchableOpacity style={styles.actionBtn} onPress={handleSendOtp} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Get OTP</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.success }]}
              onPress={handleVerifyOtp}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Verify & Login</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={18} color={Colors.navy} />
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link to Signup */}
        <View style={styles.signupPrompt}>
          <Text style={styles.promptText}>New to Tripzo?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 117, 71, 0.4)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.orange,
    fontWeight: '600',
    marginTop: 2,
  },
  loginCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 22,
    ...Shadows.lg,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  cardSubheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  demoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: Radii.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: 8,
  },
  demoCalloutText: {
    fontSize: 11,
    color: '#9A3412',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    marginTop: 18,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    height: 50,
    gap: 4,
  },
  flagText: {
    fontSize: 16,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  textInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  otpSection: {
    marginTop: 16,
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  changePhoneText: {
    fontSize: 12,
    color: Colors.orange,
    fontWeight: '600',
  },
  otpInput: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: Colors.navy,
    backgroundColor: '#FFF7ED',
  },
  otpHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginTop: 20,
    gap: 8,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.navy,
    backgroundColor: Colors.white,
    gap: 8,
  },
  guestBtnText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  promptText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  signupLink: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '700',
  },
});
