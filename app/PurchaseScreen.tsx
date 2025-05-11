// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases, CREDIT_PACKS } from '../context/PurchaseContext';

const creditPacks = [
  { id: 'small_credit_pack', title: 'Small Pack', price: CREDIT_PACKS.small.amount, credits: CREDIT_PACKS.small.credits, sku: CREDIT_PACKS.small.sku },
  { id: 'medium_credit_pack', title: 'Medium Pack', price: CREDIT_PACKS.medium.amount, credits: CREDIT_PACKS.medium.credits, sku: CREDIT_PACKS.medium.sku, popular: true },
  { id: 'large_credit_pack', title: 'Large Pack', price: CREDIT_PACKS.large.amount, credits: CREDIT_PACKS.large.credits, sku: CREDIT_PACKS.large.sku },
];

type PurchaseScreenProps = {
  screenTitle: string;
  iconName: string;
  onCloseRoute: string;
  successRoute: string;
  successMessage: string;
};

export default function PurchaseScreen({ screenTitle, iconName, onCloseRoute, successRoute, successMessage }: PurchaseScreenProps) {
  const router = useRouter();
  const { purchaseCredits, refreshBalance, restorePurchases, purchasing, availableProducts, loading, initializationError, isOfferingsConfigured, retryInitialization } = usePurchases();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handlePurchase = useCallback(async (planId: string) => {
    try {
      if (initializationError) throw new Error(initializationError);
      if (loading || !availableProducts.length) throw new Error('Products are loading or not available');

      setSelectedPack(planId);
      const plan = creditPacks.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      await purchaseCredits(plan.sku);
      await refreshBalance();

      Alert.alert('Success', `${successMessage} ${plan.credits} credits!`, [
        { 
          text: 'OK', 
          onPress: () => {
            if (router.canGoBack() && successRoute) {
      router.navigate(successRoute);
            }
          }
        }
      ]);
    } catch (error: any) {
      console.error('Purchase error:', error);
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error.userCancelled) {
        errorMessage = 'Purchase was cancelled.';
      } else if (error.message?.includes('not available')) {
        errorMessage = 'In-app purchases are not available on this device.';
      } else if (error.message?.includes('already owned')) {
        errorMessage = 'You already own this item. Credits will be updated.';
        refreshBalance();
        return;
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      Alert.alert('Purchase Error', errorMessage);
    } finally {
      setSelectedPack(null);
    }
  }, [purchaseCredits, refreshBalance, router, loading, availableProducts, initializationError, successRoute, successMessage]);

  const handleRestorePurchases = async () => {
    try {
      if (initializationError) throw new Error(initializationError);
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleClose = () => {
    if (onCloseRoute.includes('(tabs)')) {
      router.replace(onCloseRoute);
    } else {
      router.navigate(onCloseRoute);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      console.log('Retrying RevenueCat initialization...');
      await retryInitialization();
      if (!initializationError && availableProducts.length > 0) {
        Alert.alert('Success', 'Initialization retry successful. Please try your purchase again.');
        router.setParams({ refresh: Date.now().toString() });
      } else {
        Alert.alert('Retry Failed', 'Initialization still failed. Please check your configuration.');
      }
    } catch (error) {
      console.error('Retry error:', error);
      Alert.alert('Retry Failed', 'An error occurred during retry. Please check the logs.');
    } finally {
      setRetrying(false);
    }
  };

  const renderPurchaseButton = (pack: typeof creditPacks[0]) => {
    const isDisabled = selectedPack !== null && selectedPack !== pack.id || purchasing || loading || !availableProducts.length || !!initializationError;
    const product = availableProducts.find(p => p.product?.identifier === pack.sku);
    const displayPrice = product?.product?.priceString || `$${pack.price}`;

    return (
      <TouchableOpacity
        style={[
          styles.purchaseButton,
          pack.popular && styles.popularPaymentButton,
          isDisabled && styles.disabledButton,
        ]}
        onPress={() => handlePurchase(pack.id)}
        disabled={isDisabled}
      >
        {selectedPack === pack.id && purchasing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.purchaseButtonText}>
            Purchase {pack.credits} Credits • {displayPrice}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !retrying) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (initializationError || !isOfferingsConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {initializationError || 'Offerings are not configured properly. Please check your RevenueCat dashboard.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} disabled={retrying}>
            <Text style={styles.retryText}>{retrying ? 'Retrying...' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="#ffffff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Ionicons name={iconName as any} size={48} color="#6366f1" />
          <Text style={styles.heroTitle}>{screenTitle}</Text>
          <Text style={styles.heroSubtitle}>Purchase credits to continue using Cosmic AI.</Text>
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
              <Text style={styles.packPrice}>{pack.credits} Credits</Text>
              {renderPurchaseButton(pack)}
            </View>
          ))}
        </View>
        
        <View style={styles.restoreContainer}>
          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={purchasing || loading || !!initializationError || !isOfferingsConfigured}
          >
            <Text style={styles.restoreText}>
              Restore Previous Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  loading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  errorText: { 
    color: '#1e293b', 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  retryButton: { 
    backgroundColor: '#6366f1', 
    padding: 10, 
    borderRadius: 8 
  },
  retryText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  closeButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 40 : 20, 
    left: 20, 
    padding: 8, 
    zIndex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  contentContainer: { 
    padding: 16, 
    paddingTop: 60 
  },
  heroSection: { 
    alignItems: 'center', 
    padding: 32, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
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
    textAlign: 'center', 
    marginTop: 8 
  },
  packsContainer: { 
    paddingVertical: 16 
  },
  packCard: { 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
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
  purchaseButton: { 
    backgroundColor: '#6366f1', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    minHeight: 52,
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  popularPaymentButton: { 
    backgroundColor: '#4f46e5' 
  },
  disabledButton: { 
    opacity: 0.6 
  },
  purchaseButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  restoreContainer: { 
    marginTop: 24, 
    alignItems: 'center',
    marginBottom: 32
  },
  restoreButton: { 
    padding: 12 
  },
  restoreText: { 
    color: '#6366f1', 
    fontSize: 14, 
    fontWeight: '500' 
  }
}); 
