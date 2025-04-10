import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function PsychicOnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to first step after a short delay
    const timer = setTimeout(() => {
      router.replace('/psychic-onboarding/profile-photo');
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.text}>Loading psychic onboarding...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
}); 