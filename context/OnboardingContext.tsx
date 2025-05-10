import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type OnboardingContextType = {
  isOnboarded: boolean;
  userType: 'user' | 'coach' | null;
  completeOnboarding: (type?: 'user' | 'coach') => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [userType, setUserType] = useState<'user' | 'coach' | null>(null);
  const { user } = useAuth();
  const isMounted = useRef(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Stabilized onboarding check - only runs once on mount and when user changes
  useEffect(() => {
    // Skip if we've already initialized or no user is available
    if (isInitialized.current && !user) return;
    
    const checkOnboardingStatus = async () => {
      try {
        console.log('OnboardingContext - Checking onboarding status');
        
        // Get onboarding status from storage
        const onboardedValue = await AsyncStorage.getItem('onboarded');
        const userTypeValue = await AsyncStorage.getItem('userType');
        
        console.log('OnboardingContext - Onboarded value from storage:', onboardedValue);
        console.log('OnboardingContext - User type value from storage:', userTypeValue);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          const isOnboardedValue = onboardedValue === 'true';
          setIsOnboarded(isOnboardedValue);
          setUserType(userTypeValue === 'user' ? 'user' : userTypeValue === 'coach' ? 'coach' : null);
          
          // Mark as initialized to prevent repeated checks
          isInitialized.current = true;
          console.log('OnboardingContext - Initialization complete');
        }
      } catch (error) {
        console.error('OnboardingContext - Error checking onboarding status:', error);
        if (isMounted.current) {
          setIsOnboarded(false);
          setUserType(null);
        }
      }
    };
    
    checkOnboardingStatus();
  }, [user]);

  // Memoize the completeOnboarding function to prevent unnecessary rerenders
  const completeOnboarding = useCallback(async (type?: 'user' | 'coach') => {
    try {
      console.log('OnboardingContext - Completing onboarding as type:', type || 'default');
      
      // Store the onboarding status and user type
      await AsyncStorage.setItem('onboarded', 'true');
      
      if (type) {
        await AsyncStorage.setItem('userType', type);
      }
      
      // Store timestamp to track onboarding completion
      await AsyncStorage.setItem('onboarding_completed_at', new Date().toISOString());
      
      // Clear any new registration flags to prevent future redirect conflicts
      await AsyncStorage.removeItem('registration_status');
      
      // Update state
      if (isMounted.current) {
        setIsOnboarded(true);
        if (type) setUserType(type);
      }
      
      console.log('OnboardingContext - Onboarding completed successfully');
      return;
    } catch (error) {
      console.error('OnboardingContext - Error completing onboarding:', error);
      throw error;
    }
  }, []);

  return (
    <OnboardingContext.Provider value={{ isOnboarded, userType, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
