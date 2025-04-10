// Create a new file for navigation debugging
export const logNavigation = (action: string, from: string, to: string, params?: any) => {
  console.log(`[Navigation] ${action}: ${from} → ${to}`, params || '');
};

// Usage example in components:
// import { logNavigation } from '../lib/navigationDebug';
// 
// const handleGoToAccount = () => {
//   logNavigation('Navigate', 'Settings', 'Account');
//   router.push('/settings/account');
// }; 