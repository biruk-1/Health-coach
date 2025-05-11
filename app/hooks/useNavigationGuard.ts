import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useNavigationGuard() {
  const [isLocked, setIsLocked] = useState(false);

  // Simple operation executor - just runs the operation without any locking
  const lockNavigation = useCallback(async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (error) {
      console.error('Navigation operation failed:', error);
    }
  }, []);

  // Always return false - no more navigation locks
  const checkNavigationLock = useCallback(async () => {
    return false;
  }, []);

  // No-op functions that don't actually set flags anymore
  const setNavigationFlag = useCallback(async (flag: string) => {
    console.log(`Navigation flag ${flag} would be set (disabled)`);
  }, []);

  const clearNavigationFlag = useCallback(async (flag: string) => {
    console.log(`Navigation flag ${flag} would be cleared (disabled)`);
  }, []);

  return {
    isLocked: false, // Always return false
    lockNavigation,
    checkNavigationLock,
    setNavigationFlag,
    clearNavigationFlag
  };
} 