import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { notificationService, AppNotification } from '../services/notificationService';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';

export default function NotificationsScreen() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const list = await notificationService.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    showToast('All notifications marked as read', { type: 'success' });
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color={Colors.orange} />;
      case 'tracking':
        return <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.navy} />;
      case 'offer':
      default:
        return <Ionicons name="pricetag-outline" size={20} color={Colors.success} />;
    }
  };

  return (
    <View style={styles.container}>
      <TripzoHeader
        title="Notifications"
        rightElement={
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View
              key={item.id}
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
            >
              <View style={styles.iconBox}>{getIcon(item.type)}</View>

              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                <Text style={styles.notifMessage}>{item.message}</Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
    position: 'relative',
    ...Shadows.sm,
  },
  notifCardUnread: {
    backgroundColor: '#FFFDFB',
    borderColor: 'rgba(255, 117, 71, 0.3)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  notifMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    fontWeight: '600',
  },
});
