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
        // Clear stale navigation flags
        await Promise.all([
          AsyncStorage.removeItem('navigating_to_detail'),
          AsyncStorage.removeItem('navigating_to_add_funds'),
          AsyncStorage.removeItem('navigating_to_cosmic_ai'),
          AsyncStorage.removeItem('detail_protection_started_at'),
          AsyncStorage.removeItem('add_funds_protection_started_at'),
          AsyncStorage.removeItem('cosmic_ai_protection_started_at')
        ]);

        // Set initialized after a short delay
        setTimeout(() => {
          setIsInitialized(true);
        }, 500);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  return isInitialized;
} 