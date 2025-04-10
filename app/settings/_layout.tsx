
import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsLayout() {
  const router = useRouter();

  const handleBack = () => {
    console.log('Navigating back');
    router.back();
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#faf8f8',
        },
        headerTintColor: '#0e0d0d',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#161515" />
          </TouchableOpacity>
        ),
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-funds"
        options={{
          title: 'Add Funds',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: 'Account',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'Help & Support',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
});