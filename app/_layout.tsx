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
        'verify-coach'
      ];
      
      // Get the current path from segments
      const currentRoute = segments[0] || '';
      
      // Check if we're in the tabs section
      const isTabsRoute = currentRoute === '(tabs)';
      
      // Check if the current path is in the relevant route groups
      const isPublicRoute = publicRoutes.includes(currentRoute);
      const isPersonalizationRoute = personalizationRoutes.includes(currentRoute);
      const isSpecialRoute = specialRoutes.includes(currentRoute);
      
      // Welcome page is always accessible
      if (currentRoute === '' || currentRoute === 'index') {
        return;
      }
      
      // Only handle navigation after initial render
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        return;
      }

      console.log('Current route:', currentRoute);
      console.log('Is public route:', isPublicRoute);
      console.log('Is personalization route:', isPersonalizationRoute);
      console.log('User:', user ? 'Logged in' : 'Not logged in');
      console.log('Is onboarded from context:', isOnboarded);
      
      // For login cases, use direct AsyncStorage check
      if (user) {
        const isOnboardedFromStorage = await getOnboardingStatusFromStorage();
        console.log('Is onboarded from storage:', isOnboardedFromStorage);
        
        // User is authenticated - check onboarding status
        if (isOnboardedFromStorage) {
          // User is onboarded
          if (isPersonalizationRoute) {
            // User is already onboarded but trying to access onboarding screens
            console.log('User already onboarded, redirecting to main app');
            router.replace('/(tabs)');
            return;
          }
        } else {
          // User is not onboarded
          if (isTabsRoute) {
            // User is trying to access main app without onboarding
            console.log('User not onboarded, redirecting to onboarding selection');
            
            // Prevent redirect loops
            if (!directedToOnboarding) {
              setDirectedToOnboarding(true);
              router.replace('/onboarding-select');
            }
            return;
          }
        }
        
        // Handle login/onboarding screens for authenticated users
        if (currentRoute === 'login' || currentRoute === 'onboarding') {
          if (isOnboardedFromStorage) {
            console.log('Redirecting authenticated and onboarded user to main app');
            router.replace('/(tabs)');
          } else {
            console.log('Redirecting authenticated but not onboarded user to complete onboarding');
            router.replace('/onboarding-select');
          }
        }
      } else {
        // Not authenticated
        if (isTabsRoute || (!isPublicRoute && !isSpecialRoute)) {
          console.log('Redirecting unauthenticated user to welcome page');
          router.replace('/');
        }
      }
    };

    checkAndRedirect();
  }, [user, isOnboarded, segments, router, directedToOnboarding]);

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