import { Stack } from 'expo-router';
import React from 'react';

export default function OffersStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="applicants" />
      <Stack.Screen name="createOffer" />
    </Stack>
  );
}