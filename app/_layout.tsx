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
      // If we have a new registration flag, use it but DON'T remove it
      // to ensure consistency across multiple checks
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
        
        // Check for navigation lock first
        try {
          const lastNavigationTime = await AsyncStorage.getItem('last_navigation_timestamp');
          if (lastNavigationTime) {
            const timeSinceLastNavigation = Date.now() - parseInt(lastNavigationTime);
            // If navigation happened within the last 3 seconds, skip any redirect
            if (timeSinceLastNavigation < 3000) {
              console.log('initialCheck - Recent navigation detected, respecting navigation lock');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking navigation lock:', error);
        }
        
        // For new registrations, check the registration status
        const isNewUser = await checkRegistrationStatus();
        
        // HIGHEST PRIORITY: If this is a newly registered user, ALWAYS send to onboarding-select
        if (isNewUser) {
          console.log('NavigationGuard - App initial load, new user - going to onboarding selection');
          
          // Set a navigation lock timestamp before navigating
          await AsyncStorage.setItem('last_navigation_timestamp', Date.now().toString());
          
          navigateSafely('/onboarding-select');
          return; // Exit early to prevent any other redirects
        }
        
        // Only redirect existing users to tabs if they're not on a special route
        console.log('NavigationGuard - App initial load, returning user');
        
        // Check current route before redirecting
        const currentSegment = segments[0] || '';
        const currentSubSegment = segments[1] || '';
        
        // Don't redirect if we're on a special route
        const isSpecialRoute = 
          currentSegment === '[id]' || 
          currentSegment === 'PurchaseScreen' || 
          (currentSegment === 'settings' && currentSubSegment === 'add-funds');
        
        if (isSpecialRoute) {
          console.log('NavigationGuard - Special route detected, skipping redirect');
          return;
        }
        
        console.log('NavigationGuard - Redirecting to tabs');
        navigateSafely('/(tabs)');
      }
    };
    
    initialCheck();
  }, [user, router, segments]);

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

    // Check for recently applied navigation lock
    const checkNavigationLock = async () => {
      try {
        const lastNavigationTime = await AsyncStorage.getItem('last_navigation_timestamp');
        if (lastNavigationTime) {
          const timeSinceLastNavigation = Date.now() - parseInt(lastNavigationTime);
          // If navigation happened within the last 3 seconds, skip any redirect
          if (timeSinceLastNavigation < 3000) {
            console.log('NavigationGuard - Recent navigation detected, respecting navigation lock');
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error checking navigation lock:', error);
        return false;
      }
    };

    // Add special handling for the onboarding-select route for newly registered users
    const checkRegistrationBeforeNavigation = async () => {
      // First check for navigation lock
      const isLocked = await checkNavigationLock();
      if (isLocked) {
        return true;
      }

      // Check current route
      const currentRoute = segments[0] || '';
      
      // For onboarding-select route, do an immediate check for new registration status
      // This is critical to prevent unwanted redirects
      if (currentRoute === 'onboarding-select' && user) {
        try {
          const registrationStatus = await AsyncStorage.getItem('registration_status');
          if (registrationStatus && registrationStatus.startsWith('new_')) {
            console.log('NavigationGuard - Protecting onboarding-select for newly registered user');
            setIsNewRegistration(true);
            // Set navigation lock to prevent any conflicts with other checks
            isNavigating.current = true;
            setTimeout(() => {
              isNavigating.current = false;
            }, 1000);
            return true;
          }
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      }
      return false;
    };

    // Immediately perform this check before any other navigation logic
    checkRegistrationBeforeNavigation().then(isProtectedRoute => {
      if (isProtectedRoute) {
        console.log('NavigationGuard - Protected route detected, skipping other navigation checks');
        return;
      }

      // Then proceed with regular navigation check
      checkAndRedirect();
    });
  }, [user, isOnboarded, segments, router, directedToOnboarding, isNewRegistration]);

  useEffect(() => {
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
        'verify-coach',
        'settings/add-funds',
        'PurchaseScreen',
        '[id]' // Explicitly mark the detail page as a special route
      ];
      
      // Get the current path from segments
      const currentRoute = segments[0] || '';
      const currentSubRoute = segments[1] || '';
      
      // Check if we're in a settings subpath
      const isSettingsPath = currentRoute === 'settings';
      const isAddFundsPath = isSettingsPath && currentSubRoute === 'add-funds';
      
      // Check if we're in the tabs section
      const isTabsRoute = currentRoute === '(tabs)';
      
      // Handle detail page (fix for [id].tsx not redirecting)
      const isDetailPage = currentRoute === '[id]';
      
      console.log('NavigationGuard - Checking route:', currentRoute, isDetailPage ? '(Detail Page)' : '');

      // Handle purchase screens
      const isPurchaseScreen = currentRoute === 'PurchaseScreen';

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
      
      // *** Critical fix: Never redirect away from the detail page when user is logged in ***
      if (isDetailPage && user) {
        console.log('NavigationGuard - Detail page detected with logged in user - PROTECTING ROUTE');
        return;
      }
      
      // Important: Don't redirect on special routes when user is logged in
      if ((isDetailPage || isPurchaseScreen || isAddFundsPath) && user) {
        console.log('NavigationGuard - Allowing access to special route for logged in user:', currentRoute + (currentSubRoute ? '/' + currentSubRoute : ''));
        // Explicitly prevent any navigation to tabs for special routes
        return;
      }
      
      if (user) {
        // User is authenticated - check onboarding status
        const isOnboardedFromStorage = await getOnboardingStatusFromStorage();
        console.log('NavigationGuard - Is onboarded from storage:', isOnboardedFromStorage);
        
        // HANDLING FOR NEW USERS (not onboarded yet)
        // This needs to be checked first to prevent other conditions from interfering
        if (isNewRegistration) {
          console.log('NavigationGuard - User is newly registered');
          
          // If they're already in a personalization route, let them stay there
          if (isPersonalizationRoute) {
            console.log('NavigationGuard - Newly registered user already in personalization flow');
            return;
          }
          
          // Redirect to onboarding-select unless they're already there
          if (currentRoute !== 'onboarding-select') {
            console.log('NavigationGuard - Newly registered user, redirecting to onboarding selection');
            
            // Set a navigation lock timestamp before navigating
            await AsyncStorage.setItem('last_navigation_timestamp', Date.now().toString());
            
            navigateSafely('/onboarding-select');
          }
          return;
        }
        
        // HANDLING FOR RETURNING USERS (already onboarded)
        if (isOnboardedFromStorage) {
          // Never redirect away from detail pages
          if (isDetailPage) {
            console.log('NavigationGuard - Protected detail page access for logged in user');
            return;
          }
          
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
        } else {
          // Skip additional navigation checks for special routes (for users who aren't onboarded)
          if (isDetailPage || isPurchaseScreen || isAddFundsPath) {
            console.log('NavigationGuard - Not onboarded but on special route, skipping redirect');
            return;
          }
          
          // Handle login screen for authenticated users - always go to tabs if not a new registration
          if (currentRoute === 'login') {
            console.log('NavigationGuard - Authenticated user on login screen, redirecting to tabs');
            navigateSafely('/(tabs)');
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