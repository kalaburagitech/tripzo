import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'offer' | 'tracking';
  read: boolean;
}

const NOTIFICATIONS_KEY = '@tripzo_notifications';

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (data) return JSON.parse(data);

      const defaults: AppNotification[] = [
        {
          id: 'n1',
          title: 'Welcome to Tripzo!',
          message: 'Enjoy ₹100 flat off on your first bus booking with coupon WELCOME100.',
          time: 'Just now',
          type: 'offer',
          read: false,
        },
        {
          id: 'n2',
          title: 'Direct Buses: Bengaluru - Kalaburagi',
          message: 'Overnight luxury Volvo AC sleeper coaches are now available daily.',
          time: '2 hours ago',
          type: 'booking',
          read: true,
        },
        {
          id: 'n3',
          title: 'Weekend Travel Deals',
          message: 'Get 15% discount on Goa and Mysuru weekend getaways with WEEKEND15.',
          time: 'Yesterday',
          type: 'offer',
          read: true,
        },
      ];
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  },

  async markAllAsRead(): Promise<void> {
    const list = await this.getNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  async addNotification(title: string, message: string, type: 'booking' | 'offer' | 'tracking'): Promise<void> {
    const list = await this.getNotifications();
    list.unshift({
      id: `notif_${Date.now()}`,
      title,
      message,
      time: 'Just now',
      type,
      read: false,
    });
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  },
};
