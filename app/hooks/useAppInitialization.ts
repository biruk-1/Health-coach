import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAppInitialization() {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationStarted = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      // Prevent multiple initialization attempts
      if (initializationStarted.current) return;
      initializationStarted.current = true;

      try {
        // Clear ALL navigation flags and protection markers
        console.log('Clearing all navigation flags and locks');
        
        const keysToRemove = [
          'navigating_to_detail',
          'navigating_to_add_funds',
          'navigating_to_cosmic_ai',
          'detail_protection_started_at',
          'add_funds_protection_started_at',
          'cosmic_ai_protection_started_at',
          'detail_flag_set_at',
          'general_navigation_lock'
        ];
        
        await AsyncStorage.multiRemove(keysToRemove);
        
        // Set initialized immediately
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  return isInitialized;
} 