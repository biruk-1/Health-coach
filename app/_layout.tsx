import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { PurchaseProvider } from '../context/PurchaseContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
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
  const initialRenderRef = useRef(true);
  const [directedToOnboarding, setDirectedToOnboarding] = useState(false);
  const isInitialRender = useRef(true);
  // Track if the user just registered (vs logged in)
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  // Add a nav lock to prevent multiple redirects
  const isNavigating = useRef(false);
  // Track first app load to handle direct routing properly
  const isFirstLoad = useRef(true);
  // Track route history to prevent duplicate navigation to the same route
  const lastRoute = useRef('');
  // Track time of last navigation to prevent rapid redirects
  const lastNavigationTime = useRef(0);

  // Helper function to directly check AsyncStorage for onboarding status
  const getOnboardingStatusFromStorage = async () => {
    try {
      const onboardedValue = await AsyncStorage.getItem('onboarded');
      return onboardedValue === 'true';
    } catch (error) {
      console.error('Error getting onboarding status from storage:', error);
      return false;
    }
  };

  // Helper function to check if user is newly registered
  const checkRegistrationStatus = async () => {
    try {
      const registrationStatus = await AsyncStorage.getItem('registration_status');
      // If we have a new registration flag, use it then clear it
      if (registrationStatus === 'new') {
        console.log('NavigationGuard - User is newly registered');
        await AsyncStorage.removeItem('registration_status');
        setIsNewRegistration(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  };

  // Safely execute navigation with debouncing
  const navigateSafely = (destination: string) => {
    // Prevent duplicate navigation to the same route
    if (lastRoute.current === destination) {
      console.log(`NavigationGuard - Already navigated to ${destination}, skipping duplicate navigation`);
      return;
    }
    
    // Prevent navigation if we've navigated recently (within 1 second)
    const now = Date.now();
    if (now - lastNavigationTime.current < 1000) {
      console.log('NavigationGuard - Navigation attempted too quickly, throttling');
      return;
    }
    
    // Set the navigation lock
    isNavigating.current = true;
    lastRoute.current = destination;
    lastNavigationTime.current = now;
    
    console.log(`NavigationGuard - Navigating to ${destination}`);
    router.replace(destination);
  };

  // Initial load effect - check auth status and perform initial routing
  useEffect(() => {
    const initialCheck = async () => {
      if (user && isFirstLoad.current) {
        isFirstLoad.current = false;
        
        // Check if this is a returning user (has completed onboarding)
        const isOnboardedFromStorage = await getOnboardingStatusFromStorage();
        
        // For returning users (who have completed onboarding), go directly to tabs
        if (isOnboardedFromStorage) {
          console.log('NavigationGuard - App initial load, returning user - going to tabs');
          navigateSafely('/(tabs)');
        } else {
          // For new registrations, check the registration status
          const isNewUser = await checkRegistrationStatus();
          
          if (isNewUser) {
            console.log('NavigationGuard - App initial load, new user - going to onboarding selection');
            navigateSafely('/onboarding-select');
          }
        }
      }
    };
    
    initialCheck();
  }, [user, router]);

  useEffect(() => {
    // Check registration status on mount
    checkRegistrationStatus();
  }, []);

  // Reset navigation lock when route changes
  useEffect(() => {
    const currentRoute = segments[0] || '';
    
    // If we've navigated to a different route than our last navigation target,
    // we can release the navigation lock
    if (currentRoute !== '' && lastRoute.current !== '' && currentRoute !== lastRoute.current) {
      console.log(`NavigationGuard - Route changed from ${lastRoute.current} to ${currentRoute}, resetting navigation lock`);
      isNavigating.current = false;
    }
  }, [segments]);

  useEffect(() => {
    // Skip navigation on the very first render to prevent flashing
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // If already navigating, prevent additional navigation attempts
    if (isNavigating.current) {
      console.log('NavigationGuard - Navigation in progress, skipping redirect check');
      return;
    }

    const checkAndRedirect = async () => {
      // Public routes that don't require authentication
      const publicRoutes = [
        'onboarding',  
        'login', 
        'index',
        '',
        '(auth)',
        'verify-psychic'
      ];
      
      // Personalization routes that require authentication but not onboarding
      const personalizationRoutes = [
        'onboarding-select',
        'user-onboarding',
        'coach-onboarding'
      ];
      
      // Special routes that have their own handling
      const specialRoutes = [
        'verify-details', 
        'verify-success', 
        'psychic-onboarding',
        'verify-coach'
      ];
      
      // Get the current path from segments
      const currentRoute = segments[0] || '';
      
      // Check if we're in the tabs section
      const isTabsRoute = currentRoute === '(tabs)';
      
      // Handle detail page (fix for [id].tsx not redirecting)
      const isDetailPage = currentRoute === '[id]';

      // Helper function to check if the current route is in the personalization flow
      const isPersonalizationRoute = personalizationRoutes.includes(currentRoute);

      // Welcome page is always accessible
      if (currentRoute === '' || currentRoute === 'index') {
        return;
      }
      
      // Only handle navigation after initial render
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        return;
      }

      console.log('NavigationGuard - Current route:', currentRoute);
      console.log('NavigationGuard - User:', user ? 'Logged in' : 'Not logged in');
      console.log('NavigationGuard - Is onboarded from context:', isOnboarded);
      console.log('NavigationGuard - Is new registration:', isNewRegistration);
      
      // Important: Don't redirect on detail page when user is logged in
      if (isDetailPage && user) {
        console.log('NavigationGuard - Allowing access to detail page for logged in user');
        return;
      }
      
      if (user) {
        // User is authenticated - check onboarding status
        const isOnboardedFromStorage = await getOnboardingStatusFromStorage();
        console.log('NavigationGuard - Is onboarded from storage:', isOnboardedFromStorage);
        
        // HANDLING FOR RETURNING USERS (already onboarded)
        if (isOnboardedFromStorage) {
          // User is authenticated and onboarded
          if (isPersonalizationRoute) {
            // User is already onboarded but trying to access onboarding screens
            console.log('NavigationGuard - User already onboarded, redirecting to main app');
            navigateSafely('/(tabs)');
            return;
          }
          
          // If user is in login screen but already logged in and onboarded, send to tabs
          if (currentRoute === 'login') {
            console.log('NavigationGuard - Logged in user on login screen, redirecting to tabs');
            navigateSafely('/(tabs)');
            return;
          }
        } 
        // HANDLING FOR NEW USERS (not onboarded yet)
        else {
          // If this is a newly registered user, they should go to onboarding-select
          if (isNewRegistration && !isPersonalizationRoute && currentRoute !== 'onboarding-select') {
            console.log('NavigationGuard - Newly registered user, redirecting to onboarding selection');
            navigateSafely('/onboarding-select');
            return;
          }
          
          // User is authenticated but NOT onboarded (and not a new registration)
          // User is trying to access main app without onboarding
          if (isTabsRoute && !directedToOnboarding) {
            console.log('NavigationGuard - User not onboarded, redirecting to onboarding selection');
            setDirectedToOnboarding(true);
            navigateSafely('/onboarding-select');
            return;
          }
          
          // Handle login screen for authenticated but not onboarded users
          if (currentRoute === 'login') {
            console.log('NavigationGuard - Authenticated but not onboarded user on login screen');
            navigateSafely('/onboarding-select');
            return;
          }
        }
      } else {
        // Not authenticated
        const requiresAuth = !publicRoutes.includes(currentRoute) && !specialRoutes.includes(currentRoute);
        
        if (requiresAuth) {
          console.log('NavigationGuard - Unauthenticated user trying to access protected route, redirecting to welcome');
          navigateSafely('/');
          return;
        }
      }
    };

    checkAndRedirect();
  }, [user, isOnboarded, segments, router, directedToOnboarding, isNewRegistration]);

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
                          <Stack screenOptions={{ headerShown: false }}>
                            {/* Public routes */}
                            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="onboarding-select" options={{ gestureEnabled: true }} />
                            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                            
                            {/* Protected routes */}
                            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                            <Stack.Screen name="[id]" options={{ presentation: 'card' }} />
                            <Stack.Screen 
                              name="settings/about" 
                              options={{ presentation: 'card', animation: 'slide_from_right' }} 
                            />
                            <Stack.Screen 
                              name="settings/add-funds" 
                              options={{ presentation: 'card', animation: 'slide_from_right' }} 
                            />
                            <Stack.Screen 
                              name="settings/help" 
                              options={{ presentation: 'card', animation: 'slide_from_right' }} 
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