import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import posthogJs from 'posthog-js';

// PostHog API key and host from environment variables
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog
let posthogInitialized = false;

export const initPostHog = async () => {
  if (posthogInitialized) return true;

  try {
    if (Platform.OS === 'web') {
      // Web implementation using posthog-js
      posthogJs.init(POSTHOG_API_KEY, {
        api_host: POSTHOG_HOST,
        persistence: 'localStorage',
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: false,
        property_blacklist: ['$current_url', '$initial_referrer', '$initial_referring_domain'],
        loaded: (posthog) => {
          // Add default properties
          posthog.register({
            platform: 'web',
            environment: __DEV__ ? 'development' : 'production',
            app_version: Constants.expoConfig?.version || '1.0.0',
          });
        }
      });
    } else {
      // For React Native, we'll just log events for now
      // In a real app, you would use posthog-react-native
      console.log('PostHog initialized for React Native (mock)');
    }
    
    posthogInitialized = true;
    console.log('PostHog initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return false;
  }
};

// Identify user
export const identifyUser = async (userId: string, properties?: Record<string, any>) => {
  if (!posthogInitialized) {
    console.warn('PostHog not initialized. Call initPostHog() first.');
    return;
  }

  try {
    if (Platform.OS === 'web') {
      posthogJs.identify(userId, properties);
    } else {
      console.log(`[PostHog] User identified: ${userId}`, properties);
    }
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
};

// Track event
export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  if (!posthogInitialized && Platform.OS === 'web') {
    await initPostHog();
  }

  try {
    if (Platform.OS === 'web') {
      posthogJs.capture(eventName, properties);
    } else {
      console.log(`[PostHog] Event: ${eventName}`, properties);
    }
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error);
  }
};

// Reset user (for logout)
export const resetUser = async () => {
  if (!posthogInitialized) {
    console.warn('PostHog not initialized. Call initPostHog() first.');
    return;
  }

  try {
    if (Platform.OS === 'web') {
      posthogJs.reset();
    } else {
      console.log('[PostHog] User reset');
    }
  } catch (error) {
    console.error('Failed to reset user:', error);
  }
};

// Track screen view
export const trackScreen = async (screenName: string, properties?: Record<string, any>) => {
  if (!posthogInitialized && Platform.OS === 'web') {
    await initPostHog();
  }

  try {
    if (Platform.OS === 'web') {
      posthogJs.capture('$screen', {
        ...properties,
        screen_name: screenName
      });
    } else {
      console.log(`[PostHog] Screen: ${screenName}`, properties);
    }
  } catch (error) {
    console.error(`Failed to track screen ${screenName}:`, error);
  }
};

// Enable or disable session recording
export const setSessionRecording = async (enabled: boolean) => {
  if (!posthogInitialized || Platform.OS !== 'web') return;

  try {
    if (enabled) {
      posthogJs.startSessionRecording();
    } else {
      posthogJs.stopSessionRecording();
    }
  } catch (error) {
    console.error(`Failed to ${enabled ? 'enable' : 'disable'} session recording:`, error);
  }
};