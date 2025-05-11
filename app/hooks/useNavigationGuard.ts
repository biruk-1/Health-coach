import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useNavigationGuard() {
  const [isLocked, setIsLocked] = useState(false);

  const lockNavigation = useCallback(async (operation: () => Promise<void>) => {
    if (isLocked) {
      console.log('Navigation is currently locked');
      return;
    }

    setIsLocked(true);
    try {
      await operation();
    } finally {
      setIsLocked(false);
    }
  }, [isLocked]);

  const checkNavigationLock = useCallback(async () => {
    const [
      navigatingToDetail,
      navigatingToAddFunds,
      navigatingToCosmicAI,
      detailProtectionStartedAt,
      addFundsProtectionStartedAt,
      cosmicAIProtectionStartedAt
    ] = await Promise.all([
      AsyncStorage.getItem('navigating_to_detail'),
      AsyncStorage.getItem('navigating_to_add_funds'),
      AsyncStorage.getItem('navigating_to_cosmic_ai'),
      AsyncStorage.getItem('detail_protection_started_at'),
      AsyncStorage.getItem('add_funds_protection_started_at'),
      AsyncStorage.getItem('cosmic_ai_protection_started_at')
    ]);

    const now = Date.now();
    const checkTimestamp = (timestamp: string | null) => {
      if (!timestamp) return false;
      const time = parseInt(timestamp, 10);
      return !isNaN(time) && now - time < 5000; // 5 second protection
    };

    return (
      navigatingToDetail === 'true' ||
      navigatingToAddFunds === 'true' ||
      navigatingToCosmicAI === 'true' ||
      checkTimestamp(detailProtectionStartedAt) ||
      checkTimestamp(addFundsProtectionStartedAt) ||
      checkTimestamp(cosmicAIProtectionStartedAt)
    );
  }, []);

  const setNavigationFlag = useCallback(async (flag: string) => {
    const now = Date.now().toString();
    await Promise.all([
      AsyncStorage.setItem(flag, 'true'),
      AsyncStorage.setItem(`${flag}_started_at`, now)
    ]);
  }, []);

  const clearNavigationFlag = useCallback(async (flag: string) => {
    await Promise.all([
      AsyncStorage.removeItem(flag),
      AsyncStorage.removeItem(`${flag}_started_at`)
    ]);
  }, []);

  return {
    isLocked,
    lockNavigation,
    checkNavigationLock,
    setNavigationFlag,
    clearNavigationFlag
  };
} 