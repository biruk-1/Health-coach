// app/settings/add-funds.tsx
import React from 'react';
import PurchaseScreen from '../PurchaseScreen';

export default function AddFundsScreen() {
  return (
    <PurchaseScreen 
      screenTitle="Add Funds" 
      iconName="wallet" 
      onCloseRoute="/(tabs)/settings" 
      successRoute="/(tabs)/settings" 
      successMessage="Successfully added" 
    />
  );
}