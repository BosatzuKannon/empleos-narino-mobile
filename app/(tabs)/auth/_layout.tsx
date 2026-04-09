import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="email-confirmation" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="support" />
    </Stack>
  );
}