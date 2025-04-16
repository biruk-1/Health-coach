// app/cosmic-ai-subscription.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PurchaseScreen from './PurchaseScreen';

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    marginTop: 30,
    left: 20,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
  },
});

export default function CosmicAISubscriptionScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home if back navigation fails
      router.push('/');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      <PurchaseScreen 
        screenTitle="Unlock Cosmic AI" 
        iconName="sparkles" 
        onCloseRoute="/" 
        successRoute="/cosmic-ai-chat" 
        successMessage="Successfully purchased" 
      />
    </View>
  );
}



