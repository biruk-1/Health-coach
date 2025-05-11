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
import { navigate, publicRoutes, personalizationRoutes, clearNavigationLocks } from '../lib/navigation';

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

// New simple NavigationGuard
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useOnboarding();
  const { user } = useAuth();
  const segments = useSegments();
  const isInitialMount = useRef(true);
  const router = useRouter();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [navLockCleared, setNavLockCleared] = useState(false);

  // First-time user check
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const firstTimeCheck = await AsyncStorage.getItem('app_first_launched');
        if (firstTimeCheck === null) {
          console.log('First time user detected');
          setIsFirstTimeUser(true);
          // Mark that the app has been launched
          await AsyncStorage.setItem('app_first_launched', 'true');
          
          // For first time users, we'll ensure they have default credits
          const storedBalance = await AsyncStorage.getItem('credits_balance');
          if (storedBalance === null) {
            await AsyncStorage.setItem('credits_balance', '3');
            console.log('Set default credits for first time user');
          }
        }
      } catch (error) {
        console.error('Error checking first time user:', error);
      }
    };
    
    checkFirstTimeUser();
  }, []);

  // Clear any stale navigation locks on startup
  useEffect(() => {
    const clearStaleNavigationLocks = async () => {
      if (!navLockCleared) {
        try {
          // Clear any existing navigation locks to start fresh
          await clearNavigationLocks();
          setNavLockCleared(true);
          console.log('Cleared stale navigation locks on startup');
        } catch (error) {
          console.error('Error clearing navigation locks on startup:', error);
        }
      }
    };
    
    clearStaleNavigationLocks();
  }, [navLockCleared]);

  // Simple navigation check that runs only when routes change
  useEffect(() => {
    const handleNavigation = async () => {
      // Skip initial render
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
        
      // Current route segment (top level)
      const currentSegment = segments[0] || '';
      console.log(`Navigation check for route: ${currentSegment}`);

      // Skip navigation checks if already navigating
      const isNavigating = await AsyncStorage.getItem('is_navigating');
      if (isNavigating) {
        console.log(`Skipping navigation check: already navigating to ${isNavigating}`);
        return;
      }

      // For first-time users, be more permissive with navigation
      if (isFirstTimeUser) {
        console.log('First-time user navigation - allowing more flexibility');
        // Allow coach details, cosmic AI, and other screens for first-time users
        if (currentSegment === '[id]' || currentSegment === 'cosmic-ai-chat' || 
            currentSegment === 'cosmic-ai-subscription') {
          return; // Allow these routes for first-time users
        }
      }

      // AUTHENTICATION CHECK
      // Not logged in users should be on public routes only
      if (!user) {
        const isPublicRoute = publicRoutes.includes(currentSegment);
        if (!isPublicRoute) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }
      }

      // ONBOARDING CHECK
      // Logged in but not onboarded users should complete onboarding
      if (user && !isOnboarded) {
        const isPersonalizationRoute = personalizationRoutes.includes(currentSegment);
        if (!isPersonalizationRoute && currentSegment !== 'login') {
          console.log('User not onboarded, redirecting to onboarding');
          navigate('/onboarding-select', { replace: true });
          return;
        }
      }

      // ROOT NAVIGATION
      // If no route is specified and user is authenticated, go to tabs
      // No need to check onboarded status - returning users should always go to home
      if (user && segments.length === 0) {
        console.log('Authenticated user at root, going to tabs');
        navigate('/(tabs)', { replace: true });
      }
    };

    handleNavigation();
  }, [segments, user, isOnboarded, isFirstTimeUser]);

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
                              name="settings"
                              options={{ presentation: 'card', gestureEnabled: false }} 
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