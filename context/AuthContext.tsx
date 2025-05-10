import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useSupabase } from './SupabaseContext';
import { trackEvent, identifyUser, resetUser } from '../lib/posthog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

const AUTH_STORAGE_KEY = '@auth_data';

type User = {
  id: string;
  email: string | undefined;
  role?: string;
  fullName?: string;
  birthDate?: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: 'user' | 'psychic' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRecoveryAttempted = useRef(false);

  const updateUserState = (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.user_metadata?.role || 'user',
      fullName: supabaseUser.user_metadata?.full_name,
      birthDate: supabaseUser.user_metadata?.birth_date,
      // Include all other relevant user metadata fields here
    };
    setUser(userData);
    return userData;
  };

  // Attempt to recover a session when initial load fails
  const recoverSession = async () => {
    if (sessionRecoveryAttempted.current) return false;
    
    try {
      console.log('Attempting to recover session...');
      sessionRecoveryAttempted.current = true;
      
      // Force refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Session recovery failed:', error?.message || 'No session returned');
        return false;
      }
      
      // Update our state with the recovered session
      setSession(data.session);
      const userData = updateUserState(data.session.user);
      
      if (userData) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          session: data.session,
          user: userData
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error recovering session:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        await loadPersistedSession();
        
        // If we still don't have a session, try to recover it
        if (mounted && !session && !user) {
          const recovered = await recoverSession();
          if (!recovered && mounted) {
            // Final loading state update if recovery failed
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initialize();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, 'Session:', !!currentSession);
      if (currentSession) {
        setSession(currentSession);
        const userData = updateUserState(currentSession.user);
        if (userData) {
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            session: currentSession,
            user: userData
          }));
        }
      } else {
        setSession(null);
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadPersistedSession = async () => {
    try {
      const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedData) {
        const { session: storedSession, user: storedUser } = JSON.parse(storedData);
        // Make sure the stored session is valid
        if (storedSession && storedSession.access_token) {
          setSession(storedSession);
          setUser(storedUser);
        } else {
          console.log('Stored session is invalid, clearing local storage');
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading persisted session:', error);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { success: false, error: error.message };
      }

      if (data?.session) {
        setSession(data.session);
        const userData = updateUserState(data.session.user);
        if (userData) {
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            session: data.session,
            user: userData
          }));
        }
        return { success: true };
      }

      return { success: false, error: 'No session data returned' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; role?: 'user' | 'psychic' }) => {
    try {
      const { token } = await api.auth.register(data);
      
      if (token) {
        // Get the session after successful registration
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error after registration:', sessionError.message);
          return { success: false, error: sessionError.message };
        }

        if (session) {
          setSession(session);
          const userData = updateUserState(session.user);
          if (userData) {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              session,
              user: userData
            }));
          }
          return { success: true };
        }
      }

      return { success: false, error: 'No session data returned' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const logNavigationEvent = (action: string, destination: string, details: Record<string, unknown> = {}) => {
    console.log(`[Navigation] ${action} to ${destination}`, details);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}