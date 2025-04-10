import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const CREDIT_PACKS = {
  small: {
    sku: Platform.select({
      ios: 'com.psychicdirectory.credits.small',
      android: 'small_credit_pack',
      default: 'small_credit_pack',
    }),
    amount: 19.99,
    credits: 20,
  },
  medium: {
    sku: Platform.select({
      ios: 'com.psychicdirectory.credits.medium',
      android: 'medium_credit_pack',
      default: 'medium_credit_pack',
    }),
    amount: 49.99,
    credits: 55,
  },
  large: {
    sku: Platform.select({
      ios: 'com.psychicdirectory.credits.large',
      android: 'large_credit_pack',
      default: 'large_credit_pack',
    }),
    amount: 99.99,
    credits: 120,
  },
};

type PurchaseContextType = {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  purchasing: boolean;
  purchaseCredits: (sku: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
};

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Simplified initialization - just refresh balance
  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshBalance();
      } catch (error) {
        console.error('Failed to initialize purchases:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
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
    }
  };

  const purchaseCredits = async (sku: string) => {
    try {
      setPurchasing(true);
      const creditPack = Object.values(CREDIT_PACKS).find(pack => pack.sku === sku);
      if (!creditPack) throw new Error(`Invalid SKU: ${sku}`);

      // Credits are only added after successful payment confirmation
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Add credits only after successful payment confirmation
        await addCredits(creditPack.credits);
      } else if (Platform.OS === 'web') {
        // Simulate web purchase - remove in production
        await new Promise(resolve => setTimeout(resolve, 1500));
        await addCredits(creditPack.credits);
      }

      console.log(`Successfully purchased ${creditPack.credits} credits with SKU: ${sku}`);
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <PurchaseContext.Provider
      value={{ balance, setBalance, loading, purchasing, purchaseCredits, refreshBalance }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
}

export { CREDIT_PACKS };