import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { PurchaseProvider } from '../context/PurchaseContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { SupabaseProvider } from '../context/SupabaseContext';
import { PostHogProvider } from '../context/PostHogContext';
import 'react-native-get-random-values';
import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';
import { copyHealthCoachCSVToFileSystem } from '../services/health-coach-data';

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
        await copyHealthCoachCSVToFileSystem();
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

  useEffect(() => {
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
      'verify-coach'
    ];
    
    // Get the current path from segments
    const currentRoute = segments[0] || '';
    
    // Check if the current path is in the relevant route groups
    const isPublicRoute = publicRoutes.includes(currentRoute);
    const isPersonalizationRoute = personalizationRoutes.includes(currentRoute);
    const isSpecialRoute = specialRoutes.includes(currentRoute);
    
    // If we're in a nested route of psychic-onboarding, don't redirect
    const isPsychicOnboardingSubroute = segments.length > 1 && segments[0] === 'psychic-onboarding';
    
    console.log('Current route:', currentRoute);
    console.log('Is public route:', isPublicRoute);
    console.log('Is personalization route:', isPersonalizationRoute);
    console.log('User:', user ? 'Logged in' : 'Not logged in');
    console.log('Is onboarded:', isOnboarded);
    
    // Don't redirect from root route - allow index.tsx to be shown as default welcome page
    if (currentRoute === '') {
      return;
    }
    
    // Handle navigation based on auth status and current route
    if (!user) {
      // Not authenticated - redirect to public routes or special routes
      if (!isPublicRoute && !isSpecialRoute) {
        router.replace('/');
      }
    } else {
      // Authenticated user
      if (isOnboarded) {
        // Fully onboarded user - should be in main app
        if (isPublicRoute || isPersonalizationRoute) {
          router.replace('/(tabs)');
        }
      } else {
        // Authenticated but not onboarded user - handle personalization flow
        if (!isPersonalizationRoute && !isSpecialRoute && currentRoute !== '(tabs)' && !isPublicRoute) {
          router.replace('/onboarding-select');
        }
      }
    }
  }, [user, isOnboarded, segments, router]);

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
                            <Stack.Screen name="index" />
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