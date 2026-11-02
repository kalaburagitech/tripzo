import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const USER_KEY = '@tripzo_user';
const ONBOARDING_KEY = '@tripzo_onboarded';

export const authService = {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async login(phone: string, otp: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    if (otp !== '123456') {
      return { success: false, message: 'Invalid OTP. Use 123456 for demo verification.' };
    }

    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: 'Rahul Traveler',
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      email: 'rahul.traveler@example.com',
      gender: 'male',
      age: 28,
      isGuest: false,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, message: 'Logged in successfully!', user };
  },

  async signup(name: string, phone: string, email: string): Promise<{ success: boolean; user: UserProfile }> {
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      email,
      isGuest: false,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, user };
  },

  async loginAsGuest(): Promise<UserProfile> {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}`,
      name: 'Guest Traveler',
      phone: '+91 9876543210',
      email: 'guest@tripzo.app',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  },

  async updateProfile(updated: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = await this.getProfile();
    if (!current) return null;
    const merged = { ...current, ...updated };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));
    return merged;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async isOnboarded(): Promise<boolean> {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  },

  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },
};
