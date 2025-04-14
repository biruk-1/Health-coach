// app/cosmic-ai-subscription.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases, CREDIT_PACKS } from '../context/PurchaseContext';
import { initializeStripe, processPayment } from '../services/stripe';
import { 
  useStripe, 
  PlatformPayButton, 
  isPlatformPaySupported,
  ApplePayButtonType,
  ApplePayButtonStyle,
  GooglePayButtonType,
  GooglePayButtonStyle,
  IsGooglePaySupportedParams
} from '@stripe/stripe-react-native';

const creditPacks = [
  { id: 'small', title: 'Small Pack', price: CREDIT_PACKS.small.amount, credits: CREDIT_PACKS.small.credits, sku: CREDIT_PACKS.small.sku },
  { id: 'medium', title: 'Medium Pack', price: CREDIT_PACKS.medium.amount, credits: CREDIT_PACKS.medium.credits, sku: CREDIT_PACKS.medium.sku, popular: true },
  { id: 'large', title: 'Large Pack', price: CREDIT_PACKS.large.amount, credits: CREDIT_PACKS.large.credits, sku: CREDIT_PACKS.large.sku },
];

export default function FitnessSubscriptionScreen() {
  const router = useRouter();
  const { purchaseCredits, refreshBalance } = usePurchases();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const { initPaymentSheet, presentPaymentSheet, confirmPaymentSheetPayment } = useStripe();

  useEffect(() => {
    initializeStripe()
      .then(() => console.log('Stripe initialized in CosmicAISubscription'))
      .catch((err) => console.error('Stripe init failed:', err));
    
    // Check platform pay support
    checkPlatformPaySupport();
  }, []);

  const checkPlatformPaySupport = async () => {
    try {
      const isSupported = await isPlatformPaySupported({
        googlePay: Platform.OS === 'android' ? {
          testEnv: !process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('live'),
          merchantCountryCode: 'US',
          allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
          environment: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('live') ? 'PRODUCTION' : 'TEST',
          apiVersion: 2
        } : undefined,
        applePay: Platform.OS === 'ios' ? {
          merchantCountryCode: 'US',
          merchantIdentifier: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID
        } : undefined
      });
      setIsPlatformPayAvailable(isSupported);
      console.log('Platform Pay supported:', isSupported);
    } catch (error) {
      console.error('Error checking platform pay support:', error);
      setIsPlatformPayAvailable(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      console.log('Starting subscription process for plan:', planId);
      setSelectedPack(planId);
      setIsLoading(true);
      const plan = creditPacks.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Process payment first
      console.log('Processing payment...');
      const { paymentIntentId } = await processPayment(
        plan.price,
        'usd',
        initPaymentSheet,
        presentPaymentSheet,
        confirmPaymentSheetPayment
      );
      console.log('Payment processed successfully with ID:', paymentIntentId);

      // After successful payment, purchase credits
      console.log('Purchasing credits for SKU:', plan.sku);
      await purchaseCredits(plan.sku);
      
      // Refresh balance to get the updated amount
      console.log('Refreshing balance...');
      await refreshBalance();
      
      // Reset states before navigation
      console.log('Resetting states and navigating...');
      setSelectedPack(null);
      setIsLoading(false);

      // Navigate to chat
      router.replace('/cosmic-ai-chat');
      
      // Show success message
      Alert.alert(
        'Success',
        `Successfully purchased ${plan.credits} credits!`
      );
    } catch (error) {
      console.error('Payment error:', error);
      handlePaymentError(error);
      setSelectedPack(null);
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error details:', error);
    let errorMessage = 'Payment failed. Please try again.';
    
    if (Platform.OS === 'ios') {
      switch (error.code) {
        case 'Canceled':
          errorMessage = 'Payment was cancelled';
          break;
        case 'DeviceNotSupported':
          errorMessage = 'This device does not support Apple Pay';
          break;
        case 'NoActiveCard':
          errorMessage = 'Please add a card to Apple Pay to continue';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (Platform.OS === 'android') {
      switch (error.code) {
        case 'Canceled':
          errorMessage = 'Payment was cancelled';
          break;
        case 'DeviceNotSupported':
          errorMessage = 'This device does not support Google Pay';
          break;
        case 'NoActiveCard':
          errorMessage = 'Please add a card to Google Pay to continue';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }

    Alert.alert('Error', errorMessage);
  };

  const handleClose = () => {
    router.push('/(tabs)');
  };

  const renderPaymentButton = (pack: typeof creditPacks[0]) => {
    if (isPlatformPayAvailable) {
      return (
        <PlatformPayButton
          onPress={() => handleSubscribe(pack.id)}
          type={Platform.OS === 'ios' ? ApplePayButtonType.Subscribe : GooglePayButtonType.Subscribe}
          appearance={Platform.OS === 'ios' ? ApplePayButtonStyle.Black : GooglePayButtonStyle.Black}
          style={[
            styles.paymentButton,
            selectedPack && selectedPack !== pack.id ? styles.disabledButton : undefined
          ] as ViewStyle[]}
          disabled={selectedPack !== null && selectedPack !== pack.id}
        />
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.paymentButton,
          pack.popular && styles.popularPaymentButton,
          selectedPack && selectedPack !== pack.id ? styles.disabledButton : undefined
        ] as ViewStyle[]}
        onPress={() => handleSubscribe(pack.id)}
        disabled={selectedPack !== null && selectedPack !== pack.id}
      >
        {selectedPack === pack.id && isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.paymentButtonText}>Pay Now</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={24} color="#1e293b" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Ionicons name="barbell" size={48} color="#6366f1" />
          <Text style={styles.heroTitle}>Unlock Premium Fitness</Text>
          <Text style={styles.heroSubtitle}>Purchase credits to get personalized fitness coaching and guidance.</Text>
        </View>
        <View style={styles.packsContainer}>
          {creditPacks.map((pack) => (
            <View key={pack.id} style={[styles.packCard, pack.popular && styles.popularPack]}>
              {pack.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Best Value</Text>
                </View>
              )}
              <Text style={styles.packTitle}>{pack.title}</Text>
              <Text style={styles.packPrice}>${pack.price} - {pack.credits} Credits</Text>
              {renderPaymentButton(pack)}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  closeButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 40, 
    left: 20, 
    padding: 8,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  contentContainer: { 
    padding: 16 
  },
  heroSection: { 
    alignItems: 'center', 
    padding: 32, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  heroTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginTop: 16 
  },
  heroSubtitle: { 
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center' 
  },
  packsContainer: { 
    paddingVertical: 16 
  },
  packCard: { 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  popularPack: { 
    borderWidth: 2, 
    borderColor: '#6366f1' 
  },
  popularBadge: { 
    position: 'absolute', 
    top: -10, 
    right: 20, 
    backgroundColor: '#6366f1', 
    padding: 4, 
    borderRadius: 8 
  },
  popularBadgeText: { 
    color: '#ffffff', 
    fontSize: 12 
  },
  packTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#1e293b', 
    marginBottom: 8 
  },
  packPrice: { 
    fontSize: 18, 
    color: '#1e293b', 
    marginBottom: 16 
  },
  paymentButton: { 
    backgroundColor: '#6366f1', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  popularPaymentButton: { 
    backgroundColor: '#4f46e5' 
  },
  disabledButton: { 
    opacity: 0.6 
  },
  paymentButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});



