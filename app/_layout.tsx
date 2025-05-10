import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { PurchaseProvider } from '../context/PurchaseContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { SupabaseProvider } from '../context/SupabaseContext';
import { PostHogProvider } from '../context/PostHogContext';
import 'react-native-get-random-values';
import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';
import { copyHealthCoachCSVToFileSystem } from '../services/health-coach-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

function StripeEnabledScreens({ children }: { children: React.ReactElement }) {
  const segments = useSegments();

  // Safely handle undefined segments
  const needsStripe = 
    segments && 
    segments.length > 0 && 
    (segments[0] === 'cosmic-ai-subscription' ||
    segments[0] === '[id]' ||
    (segments[0] === 'settings' && segments[1] === 'add-funds') ||
    segments[0] === 'cosmic-ai-chat');

  if (needsStripe) {
    return (
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
        merchantIdentifier="merchant.com.monamary.cosmicai"
        urlScheme="com.biruk123.healthCoach"
        setReturnUrlSchemeOnAndroid={true}
      >
        {/* merchant.com.monamary.cosmicai */}
        {children}
      </StripeProvider>
    );
  }

  return children;
}

function HealthCoachDataInitializer({ children }: { children: React.ReactElement }) {
  useEffect(() => {
    const initializeHealthCoachData = async () => {
      try {
        console.log('Initializing health coach data...');
        // First ensure the CSV file is available as a fallback
        await copyHealthCoachCSVToFileSystem();
        
        // Then try loading from Digital Ocean, with fallback to CSV
        const { loadHealthCoaches } = await import('../services/health-coach-data');
        await loadHealthCoaches();
        
        console.log('Health coach data initialized successfully');
      } catch (error) {
        console.error('Failed to initialize health coach data:', error);
      }
    };

    initializeHealthCoachData();
  }, []);

  return children;
}

// Add navigation guard component
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useOnboarding();
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Navigation control refs
  const isNavigating = useRef(false);
  const lastRoute = useRef('');
  const lastNavigationTime = useRef(0);
  const isInitialRender = useRef(true);
  const processedInitialRoute = useRef(false);
  
  // State to track when a user is newly registered
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  
  // List of routes that should never be redirected from
  const protectedRoutes = useMemo(() => [
    '[id]',
    'PurchaseScreen', 
    'cosmic-ai-subscription', 
    'cosmic-ai-chat',
    'settings/add-funds'
  ], []);
  
  // List of routes that don't require authentication
  const publicRoutes = useMemo(() => [
    'onboarding',  
    'login', 
    'index',
    '',
    '(auth)',
    'verify-psychic'
  ], []);
  
  // Routes for the onboarding/personalization flow
  const personalizationRoutes = useMemo(() => [
    'onboarding-select',
    'user-onboarding',
    'coach-onboarding'
  ], []);
  
  // Helper function to directly check AsyncStorage for onboarding status
  const getOnboardingStatusFromStorage = useCallback(async () => {
    try {
      const onboardedValue = await AsyncStorage.getItem('onboarded');
      console.log('NavigationGuard - Is onboarded from storage:', onboardedValue === 'true');
      return onboardedValue === 'true';
    } catch (error) {
      console.error('Error getting onboarding status from storage:', error);
      return false;
    }
  }, []);

  // Helper function to check if user is newly registered
  const checkRegistrationStatus = useCallback(async () => {
    try {
      const registrationStatus = await AsyncStorage.getItem('registration_status');
      if (registrationStatus && registrationStatus.startsWith('new_')) {
        console.log('NavigationGuard - User is newly registered with timestamp:', registrationStatus);
        setIsNewRegistration(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  }, []);

  // Safely execute navigation with debouncing and locking
  const navigateSafely = useCallback((destination: string) => {
    // Prevent duplicate navigation to the same route
    if (lastRoute.current === destination) {
      console.log(`NavigationGuard - Already navigated to ${destination}, skipping duplicate navigation`);
      return;
    }
    
    // Prevent navigation if we've navigated recently (within 3 seconds) - increased for stability
    const now = Date.now();
    if (now - lastNavigationTime.current < 3000) {
      console.log('NavigationGuard - Navigation attempted too quickly, throttling');
      return;
    }
    
    // Check if we're already navigating
    if (isNavigating.current) {
      console.log('NavigationGuard - Navigation already in progress, skipping');
      return;
    }
    
    // Set the navigation lock
    isNavigating.current = true;
    lastRoute.current = destination;
    lastNavigationTime.current = now;
    
    console.log(`NavigationGuard - Navigating to ${destination}`);
    
    // Save the timestamp to AsyncStorage to enforce navigation lock across screen transitions
    AsyncStorage.setItem('last_navigation_timestamp', now.toString())
      .catch(error => console.error('Failed to set navigation timestamp:', error));
    
    // Use push instead of replace to maintain history
    // Handle destination type correctly for Expo Router
    router.push(destination as any);
    
    // Release the navigation lock after a delay
    setTimeout(() => {
      isNavigating.current = false;
    }, 3000);
  }, [router]);

  // CONSOLIDATED NAVIGATION EFFECT - Single source of navigation truth
  useEffect(() => {
    // Skip the very first render to prevent immediate redirects on app start
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Skip navigation if we're already in the process of navigating
    if (isNavigating.current) {
      console.log('NavigationGuard - Navigation in progress, skipping redirect check');
      return;
    }
    
    const navigate = async () => {
      // Get current route information
      const currentRoute = segments[0] || '';
      const currentSubRoute = segments[1] || '';
      
      // Check if we're in a special route that should never redirect
      const isDetailPage = currentRoute === '[id]';
      const isPurchaseScreen = currentRoute === 'PurchaseScreen';
      const isAddFundsPath = currentRoute === 'settings' && currentSubRoute === 'add-funds';
      const isCosmicAI = currentRoute === 'cosmic-ai-chat' || currentRoute === 'cosmic-ai-subscription';
      const isSpecialProtectedRoute = protectedRoutes.includes(currentRoute) || isAddFundsPath || isCosmicAI;
      
      // Check if we're in a personalization route
      const isPersonalizationRoute = personalizationRoutes.includes(currentRoute);
      
      // Check if we're in a tabs route
      const isTabsRoute = currentRoute === '(tabs)';
      
      console.log('NavigationGuard - Checking route:', currentRoute, isDetailPage ? '(Detail Page)' : '');
      console.log('NavigationGuard - User:', user ? 'Logged in' : 'Not logged in');
      
      // If we're on the welcome page or index, don't navigate away
      if (currentRoute === '' || currentRoute === 'index') {
        return;
      }
      
      // Check onboarding status from storage (most reliable source of truth)
      const isOnboardedFromStorage = await getOnboardingStatusFromStorage();
      
      // PROTECTED ROUTES - Never redirect from these if user is logged in
      if (isSpecialProtectedRoute && user) {
        console.log('NavigationGuard - Protected route detected, skipping navigation');
        return;
      }
      
      // Check if this is a new registration
      if (!processedInitialRoute.current && user) {
        const isNewUser = await checkRegistrationStatus();
        processedInitialRoute.current = true;
        
        if (isNewUser && !isSpecialProtectedRoute) {
          console.log('NavigationGuard - New user, redirecting to onboarding-select');
          navigateSafely('/onboarding-select');
          return;
        }
      }
      
      // AUTHENTICATED USER HANDLING
      if (user) {
        // For onboarded users
        if (isOnboardedFromStorage) {
          // If an onboarded user is in personalization flow, redirect to tabs
          if (isPersonalizationRoute) {
            console.log('NavigationGuard - Onboarded user in personalization route, redirecting to tabs');
            navigateSafely('/(tabs)');
            return;
          }
          
          // Redirect from login to tabs for authenticated & onboarded users
          if (currentRoute === 'login') {
            console.log('NavigationGuard - Logged in user on login screen, redirecting to tabs');
            navigateSafely('/(tabs)');
            return;
          }
        } 
        // For non-onboarded users
        else {
          // If not in personalization flow and not a protected route, redirect to onboarding
          if (!isPersonalizationRoute && !isSpecialProtectedRoute) {
            console.log('NavigationGuard - Authenticated but not onboarded, redirecting to onboarding-select');
            navigateSafely('/onboarding-select');
            return;
          }
        }
      } 
      // UNAUTHENTICATED USER HANDLING
      else {
        // Check if route requires authentication
        const requiresAuth = !publicRoutes.includes(currentRoute) && !isSpecialProtectedRoute;
        
        if (requiresAuth) {
          console.log('NavigationGuard - Unauthenticated user trying to access protected route, redirecting to welcome');
          navigateSafely('/');
          return;
        }
      }
    };
    
    navigate();
  }, [user, segments, navigateSafely, publicRoutes, personalizationRoutes, protectedRoutes, getOnboardingStatusFromStorage, checkRegistrationStatus]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SupabaseProvider>
        <AuthProvider>
          <PostHogProvider>
            <OnboardingProvider>
              <PurchaseProvider>
                <FavoritesProvider>
                  <HealthCoachDataInitializer>
                    <StripeEnabledScreens>
                      <NavigationGuard>
                        <View style={styles.container}>
                          <Stack 
                            screenOptions={{ 
                              headerShown: false,
                              // Disable animation between screens to prevent flickering
                              animation: 'none',
                            }}
                          >
                            {/* Public routes */}
                            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="onboarding-select" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="login" options={{ presentation: 'modal', gestureEnabled: false }} />
                            
                            {/* Protected routes */}
                            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="[id]" options={{ presentation: 'card', gestureEnabled: false }} />
                            <Stack.Screen 
                              name="settings/about" 
                              options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: false }} 
                            />
                            <Stack.Screen 
                              name="settings/add-funds" 
                              options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: false }} 
                            />
                            <Stack.Screen 
                              name="settings/help" 
                              options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: false }} 
                            />
                            <Stack.Screen name="cosmic-ai-chat" options={{ presentation: 'card', gestureEnabled: true }} />
                            <Stack.Screen name="cosmic-ai-subscription" options={{ presentation: 'card', gestureEnabled: true }} />
                            
                            {/* Special routes */}
                            <Stack.Screen name="verify-psychic" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="verify-details" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="verify-success" options={{ presentation: 'modal', gestureEnabled: false }} />
                            <Stack.Screen name="review-request" options={{ presentation: 'modal', gestureEnabled: false }} />
                            <Stack.Screen name="psychic-onboarding" options={{ presentation: 'modal', gestureEnabled: false }} />
                          </Stack>
                          <StatusBar style="light" />
                        </View>
                      </NavigationGuard>
                    </StripeEnabledScreens>
                  </HealthCoachDataInitializer>
                </FavoritesProvider>
              </PurchaseProvider>
            </OnboardingProvider>
          </PostHogProvider>
        </AuthProvider>
      </SupabaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});