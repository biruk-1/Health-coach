import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from './AuthContext';

type OnboardingContextType = {
  isOnboarded: boolean;
  userType: 'user' | 'coach' | null;
  completeOnboarding: (type?: 'user' | 'coach') => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [userType, setUserType] = useState<'user' | 'coach' | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isMounted = useRef(true);
  const segments = useSegments();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (isOnboarded === null || authLoading) return;

    const excludedRoutes = [
      'onboarding', 
      'onboarding-select',
      'user-onboarding',
      'coach-onboarding',
      'login', 
      'verify-psychic',
      'verify-details', 
      'verify-success', 
      'psychic-onboarding',
      '[id]', 
      'cosmic-ai-chat', 
      'cosmic-ai-subscription'
    ];
    
    const currentRoute = segments[0] || '';
    const shouldExcludeRedirect = 
      excludedRoutes.includes(currentRoute) || 
      currentRoute === '(tabs)' ||  // Prevent tab redirects
      currentRoute.startsWith('settings');  // Prevent settings redirects

    if (user && isOnboarded && !shouldExcludeRedirect) {
      console.log('User is authenticated and onboarded, redirecting to tabs');
      router.replace('/(tabs)');
    } else if (!isOnboarded && !shouldExcludeRedirect && 
               currentRoute !== '(tabs)' && currentRoute !== '') {
      console.log('User is not onboarded, redirecting to onboarding selection');
      router.replace('/onboarding-select');
    }
  }, [isOnboarded, user, authLoading, segments, router]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardedValue = await AsyncStorage.getItem('onboarded');
      const userTypeValue = await AsyncStorage.getItem('userType');
      
      setIsOnboarded(onboardedValue === 'true');
      setUserType(userTypeValue === 'user' ? 'user' : userTypeValue === 'coach' ? 'coach' : null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
      setUserType(null);
    }
  };

  const completeOnboarding = async (type?: 'user' | 'coach') => {
    try {
      await AsyncStorage.setItem('onboarded', 'true');
      
      if (type) {
        await AsyncStorage.setItem('userType', type);
        setUserType(type);
      }
      
      setIsOnboarded(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ isOnboarded: !!isOnboarded, userType, completeOnboarding }}>
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
