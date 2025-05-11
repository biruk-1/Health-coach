// app/cosmic-ai-subscription.tsx
import React, { useEffect, useCallback, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PurchaseScreen from './PurchaseScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePurchases } from '../context/PurchaseContext';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../lib/navigation';
import { StatusBar } from 'expo-status-bar';

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default function CosmicAISubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Use a state to safely access purchases context
  const purchases = usePurchases ? usePurchases() : null;
  const balance = purchases?.balance;
  const buyCredits = purchases?.buyCredits;

  // Simplified navigation function
  const handleBackPress = useCallback(() => {
    navigate('/(tabs)');
  }, []);

  // Safe initialization without navigation loops
  useEffect(() => {
    const cleanup = async () => {
      try {
        // Clear any navigation flags to prevent loops
        await AsyncStorage.removeItem('navigating_to_cosmic_ai');
        await AsyncStorage.removeItem('cosmic_ai_protection_started_at');
        setLoading(false);
      } catch (err) {
        console.error('Error during cleanup:', err);
        setError('Failed to initialize. Please try going back and trying again.');
        setLoading(false);
      }
    };
    
    cleanup();
    return () => cleanup();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text>Loading subscription options...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  }

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



