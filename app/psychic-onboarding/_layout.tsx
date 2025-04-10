import React from 'react';
import { Stack } from 'expo-router';

export default function PsychicOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#111827',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#111827',
        },
      }}
    />
  );
} 