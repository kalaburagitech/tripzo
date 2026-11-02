import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/Toast';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bus-results" />
          <Stack.Screen name="bus-details" />
          <Stack.Screen name="seat-selection" />
          <Stack.Screen name="passenger-details" />
          <Stack.Screen name="boarding-dropping" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="ticket-confirmation" />
          <Stack.Screen name="tracking" />
          <Stack.Screen name="support" />
          <Stack.Screen name="notifications" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
