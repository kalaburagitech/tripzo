import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { api, convexClient, errorMessage } from './convexClient';
import { session } from './session';

const ONBOARDING_KEY = '@tripzo_onboarded';
const PROFILE_CACHE_KEY = '@tripzo_user';

type ServerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  isGuest: boolean;
  avatarUrl?: string;
  createdAt: string;
};

function toProfile(p: ServerProfile): UserProfile {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone ? `+91 ${p.phone}` : '',
    email: p.email,
    gender: p.gender,
    age: p.age,
    isGuest: p.isGuest,
    avatarUrl: p.avatarUrl,
    createdAt: p.createdAt,
  };
}

async function cache(profile: UserProfile | null) {
  if (profile) await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  else await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}

export const authService = {
  /**
   * Current user. Validates the session with the server; falls back to the
   * cached profile when offline so the app still opens.
   */
  async getProfile(): Promise<UserProfile | null> {
    const token = await session.load();
    if (!token) return null;
    try {
      const me = await convexClient.query(api.auth.me, { token });
      if (!me) {
        await session.set(null);
        await cache(null);
        return null;
      }
      const profile = toProfile(me);
      await cache(profile);
      return profile;
    } catch {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  },

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp?: string }> {
    try {
      const res = await convexClient.mutation(api.auth.sendOtp, { phone });
      return { success: true, message: res.message, demoOtp: res.demoOtp };
    } catch (err) {
      return { success: false, message: errorMessage(err) };
    }
  },

  async verifyOtp(
    phone: string,
    otp: string,
    extra?: { name?: string; email?: string; gender?: 'male' | 'female' | 'other' }
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const res = await convexClient.mutation(api.auth.verifyOtp, { phone, otp, ...extra });
      await session.set(res.token);
      const user = toProfile(res.user);
      await cache(user);
      return { success: true, message: 'Logged in successfully!', user };
    } catch (err) {
      return { success: false, message: errorMessage(err) };
    }
  },

  /** Kept for existing callers: verify an OTP for a phone number. */
  async login(phone: string, otp: string) {
    return this.verifyOtp(phone, otp);
  },

  async loginAsGuest(): Promise<UserProfile> {
    const res = await convexClient.mutation(api.auth.registerGuest, {});
    await session.set(res.token);
    const user = toProfile(res.user);
    await cache(user);
    return user;
  },

  async updateProfile(updated: Partial<UserProfile>): Promise<UserProfile | null> {
    const token = await session.load();
    if (!token) return null;
    const res = await convexClient.mutation(api.auth.updateUserProfile, {
      token,
      name: updated.name,
      email: updated.email,
      gender: updated.gender,
      age: updated.age,
      avatarUrl: updated.avatarUrl,
    });
    const profile = toProfile(res);
    await cache(profile);
    return profile;
  },

  async logout(): Promise<void> {
    const token = session.get();
    if (token) {
      try {
        await convexClient.mutation(api.auth.logout, { token });
      } catch {}
    }
    await session.set(null);
    await cache(null);
  },

  async isOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  },

  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },
};
