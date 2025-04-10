import { useRouter } from 'expo-router';

export function useAppNavigation() {
  const router = useRouter();
  
  // Enhanced back navigation function
  const goBack = () => {
    // Always try to go back
    router.back();
  };
  
  // Go back to main settings page
  const goToSettings = () => {
    router.push('/(tabs)/settings');
  };
  
  // Go to home after logout
  const goToHomeAfterLogout = () => {
    router.replace('/');
  };
  
  return {
    goBack: () => router.back(),
    goToSettings: () => router.push('/(tabs)/settings'),
    goToHomeAfterLogout: () => router.replace('/'),
    navigateToSettings: () => router.push('/(tabs)/settings'),
    navigateToHome: () => router.replace('/(tabs)'),
  };
} 