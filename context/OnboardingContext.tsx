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
    // Don't proceed if we're still loading onboarding status or auth
    if (isOnboarded === null || authLoading) return;

    // Public routes that don't require authentication
    const publicRoutes = [
      'onboarding',  
      'login', 
      'index',
      '(auth)'
    ];
    
    // Personalization routes that require authentication but not onboarding
    const personalizationRoutes = [
      'onboarding-select',
      'user-onboarding',
      'coach-onboarding'
    ];
    
    // Special routes that have their own handling
    const specialRoutes = [
      'verify-psychic',
      'verify-details', 
      'verify-success', 
      'psychic-onboarding',
      'verify-coach',
      '[id]', 
      'cosmic-ai-chat', 
      'cosmic-ai-subscription'
    ];
    
    // Get the current path from segments
    const currentRoute = segments[0] || '';
    
    // Don't redirect for special route patterns
    const noRedirectPatterns = [
      currentRoute === '(tabs)', 
      currentRoute.startsWith('settings'),
      segments.length > 1 && segments[0] === 'psychic-onboarding'
    ];
    
    const shouldNotRedirect = noRedirectPatterns.some(pattern => pattern === true);
    
    // Check if the current path is in the relevant route groups
    const isPublicRoute = publicRoutes.includes(currentRoute);
    const isPersonalizationRoute = personalizationRoutes.includes(currentRoute);
    const isSpecialRoute = specialRoutes.includes(currentRoute);
    
    console.log('OnboardingContext - Current route:', currentRoute);
    console.log('OnboardingContext - User:', user ? 'Logged in' : 'Not logged in');
    console.log('OnboardingContext - Is onboarded:', isOnboarded);
    
    // Handle navigation based on authentication and onboarding status
    if (user) {
      // Check if this is a newly registered user or if there's a navigation lock
      const checkNavigation = async () => {
        // Check for navigation lock first
        try {
          const lastNavigationTime = await AsyncStorage.getItem('last_navigation_timestamp');
          if (lastNavigationTime) {
            const timeSinceLastNavigation = Date.now() - parseInt(lastNavigationTime);
            // If navigation happened within the last 3 seconds, skip any redirect
            if (timeSinceLastNavigation < 3000) {
              console.log('OnboardingContext - Recent navigation detected, respecting navigation lock');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking navigation lock:', error);
        }
        
        // Check for newly registered user
        const registrationStatus = await AsyncStorage.getItem('registration_status');
        const isNewlyRegistered = registrationStatus && registrationStatus.startsWith('new_');
        
        // For newly registered users, never redirect from onboarding-select
        if (isNewlyRegistered && currentRoute === 'onboarding-select') {
          console.log('OnboardingContext - Newly registered user on onboarding-select, keeping them there');
          return;
        }
        
        // Only redirect if not a newly registered user and not respecting a navigation lock
        if (isOnboarded && isPersonalizationRoute && !isNewlyRegistered) {
          // If already onboarded, redirect to main app instead of personalization screens
          console.log('OnboardingContext - User is authenticated and onboarded, redirecting to tabs');
          router.replace('/(tabs)');
        }
      };
      
      checkNavigation();
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
