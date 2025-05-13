import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import Purchases, { 
  PurchasesPackage, 
  CustomerInfo, 
  LOG_LEVEL,
  Offerings
} from 'react-native-purchases';
import { REVENUECAT_API_KEY_IOS, REVENUECAT_API_KEY_ANDROID } from '@env';

// Define credit packs - Ensure these SKUs match App Store Connect exactly
export const CREDIT_PACKS = {
  small: {
    sku: 'com.biruk123.healthcoach.small_credit_pack',
    amount: 19.99,
    credits: 20,
  },
  medium: {
    sku: 'com.biruk123.healthcoach.medium_credit_pack',
    amount: 49.99,
    credits: 55,
  },
  large: {
    sku: 'com.biruk123.healthcoach.large_credit_pack',
    amount: 99.99,
    credits: 120,
  },
};

// Set to true to enable debug logging in development
const IS_DEV_MODE = __DEV__;

type PurchaseContextType = {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  purchasing: boolean;
  purchaseCredits: (sku: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  availableProducts: PurchasesPackage[];
  restorePurchases: () => Promise<void>;
  initializationError: string | null;
  isOfferingsConfigured: boolean;
  retryInitialization: () => Promise<void>;
};

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isOfferingsConfigured, setIsOfferingsConfigured] = useState(false);

  const initializeRevenueCat = async () => {
    try {
      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_API_KEY_IOS 
        : REVENUECAT_API_KEY_ANDROID;
      Purchases.setLogLevel(IS_DEV_MODE ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      console.log(`Initializing RevenueCat with API key for ${Platform.OS}:`, apiKey);

      await Purchases.configure({ apiKey });
      console.log('RevenueCat SDK configured successfully');

      const offerings: Offerings = await Purchases.getOfferings();
      console.log('Offerings response:', offerings);
      if (offerings.current) {
        const packages = offerings.current.availablePackages;
        console.log('Available packages from offering:', packages);
        if (packages.length > 0) {
          setAvailableProducts(packages);
          setIsOfferingsConfigured(true);
          packages.forEach(pkg => {
            console.log(`Package: ${pkg.identifier}, Price: ${pkg.product.priceString}, Product:`, pkg.product);
          });
        } else {
          console.warn('No packages in current offering. Falling back to manual fetch.');
          const productIDs = Object.values(CREDIT_PACKS).map(pack => pack.sku);
          console.log('Fetching products with IDs:', productIDs);
          const products = await Purchases.getProducts(productIDs);
          console.log('Manual fetch products:', products);
          if (products.length > 0) {
            const pseudoPackages = products.map(product => ({
              identifier: product.identifier,
              offeringIdentifier: 'default',
              packageType: 'CUSTOM',
              product: product
            }));
            setAvailableProducts(pseudoPackages);
            setIsOfferingsConfigured(false);
          } else {
            throw new Error('No products found in manual fetch. Check App Store Connect and RevenueCat.');
          }
        }
      } else {
        console.warn('No current offering. Falling back to manual fetch.');
        const productIDs = Object.values(CREDIT_PACKS).map(pack => pack.sku);
        console.log('No offering, fetching products with IDs:', productIDs);
        const products = await Purchases.getProducts(productIDs);
        console.log('Manual fetch products:', products);
        if (products.length > 0) {
          const pseudoPackages = products.map(product => ({
            identifier: product.identifier,
            offeringIdentifier: 'default',
            packageType: 'CUSTOM',
            product: product
          }));
          setAvailableProducts(pseudoPackages);
          setIsOfferingsConfigured(false);
        } else {
          throw new Error('No products found. Check configuration.');
        }
      }

      const info = await Purchases.getCustomerInfo();
      console.log('Customer info:', info);
      setCustomerInfo(info);
      setInitializationError(null);
    } catch (error: any) {
      const errorMessage = `Error initializing RevenueCat: ${error.message || 'Unknown error'}`;
      console.error('Initialization error details:', errorMessage, error);
      setInitializationError(errorMessage);
      setIsOfferingsConfigured(false);
      if (IS_DEV_MODE) {
        Alert.alert('Initialization Error', `${errorMessage}. See logs for details.`, [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryInitialization = async () => {
    setLoading(true);
    setInitializationError(null);
    await initializeRevenueCat();
  };

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const addCredits = async (amount: number) => {
    try {
      const currentBalance = await AsyncStorage.getItem('credits_balance');
      const existingBalance = currentBalance ? parseInt(currentBalance, 10) : 0;
      const newBalance = existingBalance + amount;
      await AsyncStorage.setItem('credits_balance', newBalance.toString());
      setBalance(newBalance);
      console.log(`Added ${amount} credits. New balance: ${newBalance}`);
    } catch (error) {
      console.error('Failed to add credits:', error);
      throw error;
    }
  };

  const refreshBalance = async () => {
    try {
      const savedBalance = await AsyncStorage.getItem('credits_balance');
      const newBalance = savedBalance ? parseInt(savedBalance, 10) : 0;
      setBalance(newBalance);
      console.log('Refreshed balance:', newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      throw error;
    }
  };

  const purchaseCredits = async (sku: string) => {
    try {
      if (initializationError) throw new Error('Purchase failed due to initialization error.');
      setPurchasing(true);
      console.log(`Starting purchase for SKU: ${sku}`);

      const creditPack = Object.values(CREDIT_PACKS).find(pack => pack.sku === sku);
      if (!creditPack) throw new Error(`Invalid SKU: ${sku}`);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const packageToPurchase = availableProducts.find(pkg => pkg.identifier === sku);
        if (!packageToPurchase) throw new Error(`Product not found for SKU: ${sku}`);
        console.log('Purchasing package:', packageToPurchase);

        const { customerInfo: newCustomerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
        console.log('Purchase result - Customer Info:', newCustomerInfo, 'Product ID:', productIdentifier);
        const purchaseSuccessful = newCustomerInfo.nonSubscriptionTransactions?.some(t => t.productIdentifier === sku);
        if (purchaseSuccessful && !newCustomerInfo.entitlements.active.has('credit_purchase')) {
          await addCredits(creditPack.credits);
          console.log('Purchase successful, credits added for consumable.');
        } else if (purchaseSuccessful) {
          console.warn('Entitlement active, unexpected for consumable.');
        } else {
          throw new Error('Purchase validation failed. No matching transaction found.');
        }

        setCustomerInfo(newCustomerInfo);
      } else {
        console.log('Unsupported platform, skipping purchase');
      }
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('Purchase cancelled by user');
      } else {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Error', error.message || 'Failed to make purchase. Please try again.');
      }
      throw error;
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    try {
      if (initializationError) throw new Error('Restore failed due to initialization error.');
      setPurchasing(true);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const restoredInfo = await Purchases.restorePurchases();
        setCustomerInfo(restoredInfo);
        let creditsRestored = false;
        const nonSubTransactions = restoredInfo.nonSubscriptionTransactions || [];

        for (const transaction of nonSubTransactions) {
          const pack = Object.values(CREDIT_PACKS).find(p => p.sku === transaction.productIdentifier);
          if (pack) {
            await addCredits(pack.credits);
            creditsRestored = true;
            console.log(`Restored ${pack.credits} credits from: ${transaction.productIdentifier}`);
          }
        }

        if (creditsRestored) {
          Alert.alert('Success', 'Previous purchases restored.');
        } else {
          Alert.alert('No Purchases', 'No previous purchases found to restore.');
        }
      } else {
        Alert.alert('Not Supported', 'Restore only supported on iOS and Android.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <PurchaseContext.Provider
      value={{ 
        balance, 
        setBalance, 
        loading, 
        purchasing, 
        purchaseCredits, 
        refreshBalance,
        availableProducts,
        restorePurchases,
        initializationError,
        isOfferingsConfigured,
        retryInitialization
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    console.warn('usePurchases must be used within a PurchaseProvider');
    return {
      balance: 0,
      setBalance: () => {},
      loading: false,
      purchasing: false,
      purchaseCredits: async () => {},
      refreshBalance: async () => {},
      availableProducts: [],
      restorePurchases: async () => {},
      initializationError: null,
      isOfferingsConfigured: false,
      retryInitialization: async () => {}
    } as PurchaseContextType;
  }
  return context;
}