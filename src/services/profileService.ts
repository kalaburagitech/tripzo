import { Passenger } from '../types';
import { api, convexClient, errorMessage } from './convexClient';
import { session } from './session';

export const profileService = {
  async getSavedPassengers(): Promise<Passenger[]> {
    const token = await session.load();
    if (!token) return [];
    try {
      const me = await convexClient.query(api.auth.me, { token });
      return (me?.savedPassengers || []).map((p) => ({ ...p, seatNumber: '' }));
    } catch {
      return [];
    }
  },

  async addSavedPassenger(passenger: Omit<Passenger, 'id' | 'seatNumber'>): Promise<Passenger> {
    const token = await session.require();
    try {
      const p = await convexClient.mutation(api.auth.savePassenger, {
        token,
        name: passenger.name,
        age: Number(passenger.age),
        gender: passenger.gender,
      });
      return { ...p, seatNumber: '' };
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  },

  async deleteSavedPassenger(id: string): Promise<void> {
    const token = await session.require();
    await convexClient.mutation(api.auth.deletePassenger, { token, passengerId: id });
  },
};
