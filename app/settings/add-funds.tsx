// app/settings/add-funds.tsx
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PurchaseScreen from '../PurchaseScreen';

export default function AddFundsScreen() {
  const { returnToId } = useLocalSearchParams();
  
  // Fix the path to properly return to the settings tab
  const onCloseRoute = returnToId ? `/[id]?id=${returnToId}` : '/(tabs)/settings';
  const successRoute = returnToId ? `/[id]?id=${returnToId}` : '/(tabs)/settings';
  
  return (
    <PurchaseScreen 
      screenTitle="Add Funds" 
      iconName="wallet" 
      onCloseRoute={onCloseRoute} 
      successRoute={successRoute} 
      successMessage="Successfully added" 
    />
  );
}