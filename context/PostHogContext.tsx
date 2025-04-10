import React, { createContext, useContext, useEffect, useState } from 'react';
import { initPostHog, identifyUser, resetUser, trackScreen } from '../lib/posthog';
import { useAuth } from './AuthContext';
import { useSegments, usePathname } from 'expo-router';

type PostHogContextType = {
  isInitialized: boolean;
  trackScreen: (screenName: string, properties?: Record<string, any>) => Promise<void>;
};

const PostHogContext = createContext<PostHogContextType | undefined>(undefined);

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();

  // Initialize PostHog
  useEffect(() => {
    const initialize = async () => {
      const success = await initPostHog();
      setIsInitialized(success);
    };

    initialize();
  }, []);

  // Identify user when logged in
  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.fullName,
        role: user.role,
      });
    } else {
      resetUser();
    }
  }, [user, isInitialized]);

  // Track screen views
  useEffect(() => {
    if (!isInitialized) return;

    // Get the current screen name from the pathname
    const screenName = pathname || 'unknown';
    
    // Track screen view
    trackScreen(screenName, {
      path: pathname,
      segments: segments.join('/'),
    });
  }, [pathname, segments, isInitialized]);

  return (
    <PostHogContext.Provider
      value={{
        isInitialized,
        trackScreen,
      }}
    >
      {children}
    </PostHogContext.Provider>
  );
}

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
}