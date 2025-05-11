import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Modern Navigation Service for Health Coach App
 * 
 * This service provides a clean, reliable way to handle navigation
 * throughout the app without race conditions or locks.
 */

// Public routes that don't require authentication
export const publicRoutes = ['login', 'index', 'onboarding', 'onboarding-select'];

// Routes related to personalization/onboarding
export const personalizationRoutes = ['onboarding-select', 'onboarding'];

// A better navigate function that prevents navigation loops
export const navigate = async (to: string, options?: { replace?: boolean }) => {
  try {
    // Check if we're already navigating
    const isNavigating = await AsyncStorage.getItem('is_navigating');
    const navigationStart = await AsyncStorage.getItem('navigation_started_at');
    const now = Date.now();
    
    // If we're already navigating and it's been less than 1000ms, prevent the navigation
    if (isNavigating && navigationStart) {
      const timeSinceLastNav = now - parseInt(navigationStart);
      if (timeSinceLastNav < 1000) {
        console.log(`Navigation prevented: already navigating to ${isNavigating}, and it's only been ${timeSinceLastNav}ms`);
        return;
      }
    }
    
    // Set navigation lock with current destination
    await AsyncStorage.setItem('is_navigating', to);
    await AsyncStorage.setItem('navigation_started_at', now.toString());
    
    console.log(`Navigating to: ${to}${options?.replace ? ' (replace)' : ''}`);
    
    // Perform navigation
    if (options?.replace) {
      router.replace(to as any);
    } else {
      router.navigate(to as any);
    }
    
    // Remove lock after delay
    setTimeout(async () => {
      const currentDestination = await AsyncStorage.getItem('is_navigating');
      if (currentDestination === to) {
        await AsyncStorage.removeItem('is_navigating');
        await AsyncStorage.removeItem('navigation_started_at');
        console.log(`Navigation lock cleared for: ${to}`);
      }
    }, 1500);
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback to direct navigation in case of errors
    if (options?.replace) {
      router.replace(to as any);
    } else {
      router.navigate(to as any);
    }
  }
};

// Function to clear all navigation locks - useful for error recovery
export const clearNavigationLocks = async () => {
  try {
    await AsyncStorage.multiRemove([
      'is_navigating', 
      'navigation_started_at',
      'navigating_to_cosmic_ai',
      'navigating_to_add_funds',
      'navigating_to_detail',
      'detail_protection_started_at',
      'detail_flag_set_at',
      'cosmic_ai_protection_started_at',
      'add_funds_protection_started_at'
    ]);
    console.log('All navigation locks cleared');
  } catch (error) {
    console.error('Error clearing navigation locks:', error);
  }
};

// Navigation utils for common destinations
export const useAppNavigation = () => {
  return {
    navigateToAddFunds,
    navigateToCoachDetails: navigateToCoachDetail,
    navigateToHome: () => navigate('/(tabs)', { replace: true }),
    navigateToAIChat: navigateToCosmicAI,
  };
};

/**
 * Navigate to coach details with proper coach ID validation
 */
export function navigateToCoachDetail(coachId: string) {
  // Validate coach ID
  if (!coachId || coachId === '(tabs)' || !/^[a-zA-Z0-9-]+$/.test(coachId)) {
    console.error('Invalid coach ID:', coachId);
    return;
  }
    
  return navigate(`/${coachId}`);
}

/**
 * Navigate to Cosmic AI chat safely
 */
export function navigateToCosmicAI() {
  return navigate('/cosmic-ai-chat');
}

/**
 * Navigate to Add Funds screen
 */
export function navigateToAddFunds() {
  return navigate('/settings/add-funds');
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

export const navigateToCoachDetails = navigateToCoachDetail;
export const navigateToAIChat = navigateToCosmicAI;

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