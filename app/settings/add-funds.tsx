// app/settings/add-funds.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases, CREDIT_PACKS } from '../../context/PurchaseContext';
import { initializeStripe, processPayment } from '../../services/stripe';
import { useStripe, PlatformPayButton, isPlatformPaySupported } from '@stripe/stripe-react-native';

export default function AddFundsScreen() {
  const router = useRouter();
  const { balance, loading, purchasing, purchaseCredits, refreshBalance } = usePurchases();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const { initPaymentSheet, presentPaymentSheet, confirmPaymentSheetPayment } = useStripe();

  useEffect(() => {
    initializeStripe()
      .then(() => console.log('Stripe initialized in AddFunds'))
      .catch((err) => {
        console.error('Stripe init failed:', err);
        setError('Failed to initialize payment system.');
      });
    
    // Check platform pay support
    checkPlatformPaySupport();
  }, []);

  const checkPlatformPaySupport = async () => {
    try {
      const isSupported = await isPlatformPaySupported({
        googlePay: Platform.OS === 'android' ? {
          merchantName: 'Cosmic AI',
          allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
          environment: 'TEST',
          apiVersion: 2
        } : undefined,
        applePay: Platform.OS === 'ios' ? {
          merchantCountryCode: 'US',
          merchantIdentifier: 'merchant.com.monamary.cosmicai'
        } : undefined
      });
      setIsPlatformPayAvailable(isSupported);
      console.log('Platform Pay supported:', isSupported);
    } catch (error) {
      console.error('Error checking platform pay support:', error);
      setIsPlatformPayAvailable(false);
    }
  };

  const handlePayment = async (amount: number, packKey: string) => {
    try {
      console.log('Starting payment process for pack:', packKey);
      setIsLoading(true);
      setSelectedPack(packKey);
      setError(null);

      // Process payment first
      console.log('Processing payment...');
      const { paymentIntentId } = await processPayment(
        amount,
        'usd',
        initPaymentSheet,
        presentPaymentSheet,
        confirmPaymentSheetPayment
      );
      console.log('Payment processed successfully with ID:', paymentIntentId);

      // After successful payment, purchase credits
      const creditPack = CREDIT_PACKS[packKey as keyof typeof CREDIT_PACKS];
      console.log('Purchasing credits for SKU:', creditPack.sku);
      await purchaseCredits(creditPack.sku);
      
      // Refresh balance to get the updated amount
      console.log('Refreshing balance...');
      await refreshBalance();
      
      // Reset states before navigation
      console.log('Resetting states and navigating...');
      setSelectedPack(null);
      setIsLoading(false);

      // Navigate back to settings
      router.replace('/(tabs)/settings');
      
      // Show success message
      Alert.alert(
        'Success',
        `Successfully purchased ${creditPack.credits} credits!`
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

    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  };

  const handleBack = () => {
    router.push('/(tabs)/settings');
  };

  const renderPaymentButton = (packKey: string, pack: typeof CREDIT_PACKS[keyof typeof CREDIT_PACKS]) => {
    if (isPlatformPayAvailable) {
      return (
        <PlatformPayButton
          onPress={() => handlePayment(pack.amount, packKey)}
          type="subscribe"
          appearance="black"
          style={[
            styles.paymentButton,
            selectedPack && selectedPack !== packKey && styles.disabledButton
          ]}
          disabled={selectedPack !== null && selectedPack !== packKey}
        />
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.paymentButton,
          selectedPack && selectedPack !== packKey && styles.disabledButton
        ]}
        onPress={() => handlePayment(pack.amount, packKey)}
        disabled={purchasing || isLoading}
      >
        {selectedPack === packKey && isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>Purchase</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading payment options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Funds',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Ionicons name="wallet" size={48} color="#6366f1" />
          <Text style={styles.title}>Add Credits</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{balance} Credits</Text>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Credit Pack</Text>
          {Object.entries(CREDIT_PACKS).map(([key, pack]) => (
            <View key={key} style={styles.creditPack}>
              <View style={styles.creditPackInfo}>
                <Text style={styles.creditPackTitle}>
                  {key === 'small' ? 'Starter' : key === 'medium' ? 'Popular' : 'Best Value'}
                </Text>
                <Text style={styles.creditPackCredits}>{pack.credits} Credits</Text>
                <Text style={styles.creditPackPrice}>${pack.amount}</Text>
                {key !== 'small' && (
                  <Text style={styles.savingsText}>
                    Save {key === 'medium' ? '10%' : '20%'}
                  </Text>
                )}
              </View>
              {renderPaymentButton(key, pack)}
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
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingText: {
    color: '#1e293b',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  creditPack: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  creditPackInfo: {
    flex: 1,
  },
  creditPackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  creditPackCredits: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  creditPackPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  savingsText: {
    fontSize: 13,
    color: '#10b981',
    marginTop: 2,
  },
  paymentButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    height: 44,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});