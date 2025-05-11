import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Modern Navigation Service for Health Coach App
 * 
 * This service provides a clean, reliable way to handle navigation
 * throughout the app without race conditions or locks.
 */

// Cache the last navigation to prevent duplicate navigations
let lastNavigation = {
  path: '',
  timestamp: 0
};
  
// Define route groups for better organization
export const publicRoutes = [
  'onboarding',
  'login',
  'index',
  '',
  '(auth)',
  'verify-psychic'
];

export const personalizationRoutes = [
  'onboarding-select',
  'user-onboarding',
  'coach-onboarding'
];
  
/**
 * Navigate to a route cleanly without race conditions
 */
export function navigate(path: string, replace: boolean = false) {
  console.log(`Navigation - Navigating to: ${path}${replace ? ' (replace)' : ''}`);
  
  if (replace) {
    router.replace(path);
  } else {
    router.navigate(path);
  }
}

/**
 * Navigate to coach details with proper coach ID validation
 */
export function navigateToCoachDetail(coachId: string) {
  // Validate coach ID
  if (!coachId || coachId === '(tabs)' || !/^[a-zA-Z0-9-]+$/.test(coachId)) {
    console.error('Invalid coach ID:', coachId);
      return;
    }
    
  navigate(`/${coachId}`);
}

/**
 * Navigate to Cosmic AI chat safely
 */
export function navigateToCosmicAI() {
  navigate('/cosmic-ai-chat');
}

/**
 * Navigate to Add Funds screen
 */
export function navigateToAddFunds() {
  navigate('/settings/add-funds');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const session = await AsyncStorage.getItem('supabase.auth.token');
    return !!session;
      } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function isOnboarded() {
  try {
    const onboarded = await AsyncStorage.getItem('onboarded');
    return onboarded === 'true';
      } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Main navigation hook for use in components
 */
export function useAppNavigation() {
  return {
    // Navigate to the coach detail screen with a clean approach
    navigateToCoachDetail: (coachId: string) => {
      console.log(`Navigating to coach detail: ${coachId}`);
      navigate(`/${coachId}`);
    },
    
    // Navigate to cosmic AI chat without any flags
    navigateToCosmicAI: () => {
      console.log('Navigating to cosmic AI chat');
      navigate('/cosmic-ai-chat');
    },
    
    // Navigate to add funds page without flags
    navigateToAddFunds: () => {
      console.log('Navigating to add funds');
      navigate('/settings/add-funds');
    },
    
    // Clean navigation back to tabs
    navigateToTabs: () => {
      console.log('Navigating back to tabs');
      router.replace('/(tabs)');
    },
    
    // Generic go back function that uses router.back() 
    goBack: () => {
      console.log('Going back');
      // Using replace to avoid stacking history
      router.back();
    }
  };
}

export default {
  navigate,
  navigateToCoachDetail,
  navigateToCosmicAI,
  navigateToAddFunds,
  isAuthenticated,
  isOnboarded,
  publicRoutes,
  personalizationRoutes
}; 