// app/cosmic-ai-subscription.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
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
  const navigation = useNavigation();

  const handleBackPress = () => {
    try {
      // Check if we can go back in history
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Use a direct path instead of "/"
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // More specific fallback
      router.push('/(tabs)');
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
        onCloseRoute="/(tabs)" 
        successRoute="/cosmic-ai-chat" 
        successMessage="Successfully purchased" 
      />
    </View>
  );
}



