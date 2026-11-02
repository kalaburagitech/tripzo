import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '../constants/theme';

interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const type = options?.type || 'info';
    setToast({ visible: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, options?.duration || 3000);
  }, []);

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return Colors.navy;
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      default:
        return Colors.navy;
    }
  };

  const getAccentColor = () => {
    switch (toast.type) {
      case 'success':
        return Colors.success;
      case 'error':
        return '#FCA5A5';
      case 'warning':
        return '#FDE68A';
      default:
        return Colors.orange;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          entering={FadeInUp.springify()}
          exiting={FadeOutUp}
          style={[styles.toastContainer, { backgroundColor: getBgColor() }]}
        >
          <Ionicons name={getIconName()} size={22} color={getAccentColor()} style={styles.icon} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    ...Shadows.lg,
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
