import AsyncStorage from '@react-native-async-storage/async-storage';
import { Passenger } from '../types';

const SAVED_PASSENGERS_KEY = '@tripzo_saved_passengers';

export const profileService = {
  async getSavedPassengers(): Promise<Passenger[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_PASSENGERS_KEY);
      if (data) return JSON.parse(data);
      // Default initial saved passengers
      const initial: Passenger[] = [
        { id: 'sp1', seatNumber: '', name: 'Rahul Sharma', age: 28, gender: 'male' },
        { id: 'sp2', seatNumber: '', name: 'Ananya Sharma', age: 26, gender: 'female' },
      ];
      await AsyncStorage.setItem(SAVED_PASSENGERS_KEY, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  },

  async addSavedPassenger(passenger: Omit<Passenger, 'id' | 'seatNumber'>): Promise<Passenger> {
    const list = await this.getSavedPassengers();
    const newPassenger: Passenger = {
      ...passenger,
      id: `sp_${Date.now()}`,
      seatNumber: '',
    };
    list.push(newPassenger);
    await AsyncStorage.setItem(SAVED_PASSENGERS_KEY, JSON.stringify(list));
    return newPassenger;
  },

  async deleteSavedPassenger(id: string): Promise<void> {
    let list = await this.getSavedPassengers();
    list = list.filter((p) => p.id !== id);
    await AsyncStorage.setItem(SAVED_PASSENGERS_KEY, JSON.stringify(list));
  },
};
