import { api, convexClient } from './convexClient';
import { session } from './session';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'offer' | 'tracking';
  read: boolean;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export function toAppNotification(n: any): AppNotification {
  const type: AppNotification['type'] =
    n.type === 'OFFER' ? 'offer' : n.type === 'TRIP_UPDATE' || n.type === 'TRIP_REMINDER' ? 'tracking' : 'booking';
  return {
    id: String(n._id),
    title: n.title,
    message: n.body,
    time: relativeTime(n.createdAt),
    type,
    read: n.isRead,
  };
}

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    const token = await session.load();
    if (!token) return [];
    try {
      const list = await convexClient.query(api.notifications.listMine, { token });
      return list.map(toAppNotification);
    } catch {
      return [];
    }
  },

  async markAllAsRead(): Promise<void> {
    const token = await session.load();
    if (!token) return;
    try {
      await convexClient.mutation(api.notifications.markAllRead, { token });
    } catch {}
  },
};
