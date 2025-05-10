import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAppNavigation() {
  const router = useRouter();
  
  // Enhanced back navigation function
  const goBack = () => {
    // Always try to go back
    router.back();
  };
  
  // Go to coach detail page
  const navigateToCoachDetail = (coachId: string) => {
    // First set a navigation timestamp to prevent navigation conflicts
    AsyncStorage.setItem('last_navigation_timestamp', Date.now().toString())
      .catch(error => console.error('Failed to set navigation timestamp:', error));
    
    // Log the navigation
    console.log(`Navigating to coach detail page for coach ID: ${coachId}`);
    
    // Use push for detail page navigation to maintain history
    router.push({
      pathname: `/[id]`,
      params: { id: coachId }
    });
  };
  
  // Navigate to add funds page
  const navigateToAddFunds = (returnToId?: string) => {
    // Set navigation timestamp
    AsyncStorage.setItem('last_navigation_timestamp', Date.now().toString())
      .catch(error => console.error('Failed to set navigation timestamp:', error));
    
    const params = returnToId ? { returnToId } : undefined;
    
    // Use push for safer navigation
    router.push({
      pathname: '/settings/add-funds',
      params
    });
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
    navigateToHome: () => router.push('/(tabs)'),
    navigateToCoachDetail,
    navigateToAddFunds
  };
} 