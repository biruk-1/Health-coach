import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { OnboardingProvider } from '../context/OnboardingContext';
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
        urlScheme="com.biruk123.boltexponativewind"
        setReturnUrlSchemeOnAndroid={true}
      >
        {/* merchant.com.monamary.cosmicai */}
        {children}
      </StripeProvider>
    );
  }

  return children;
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
                  <StripeEnabledScreens>
                    <View style={styles.container}>
                      <Stack screenOptions={{ headerShown: false }}>
                        {/* Public routes */}
                        <Stack.Screen name="index" />
                        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
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
                  </StripeEnabledScreens>
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