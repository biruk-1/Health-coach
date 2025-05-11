import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { api } from '../services/api';
import { useSupabase } from './SupabaseContext';
import { trackEvent, identifyUser, resetUser } from '../lib/posthog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

const AUTH_STORAGE_KEY = '@auth_data';

type UserData = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  height?: string;
  interests?: string[];
};

type AuthContextType = {
  user: UserData | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserState: (updatedUser: Partial<UserData>) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  updateUserState: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRecoveryAttempted = useRef(false);

  const updateUserState = (updatedUser: Partial<UserData>) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updatedUser };
    });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setIsLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          
          // Load user data
          const { data, error: userError } = await api.auth.me();
          
          if (userError || !data) {
            console.error('Error loading user data:', userError);
            
            // Try to recover if we have persistent data
            const recovered = await loadPersistedSession();
            if (!recovered) {
              setIsLoading(false);
            }
            return;
          }
          
          // Update user state
          setUser(data);
          
          // Persist data
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            session,
            user: data
          }));
          
        } else if (!sessionRecoveryAttempted.current) {
          // Try to recover from stored session data
          sessionRecoveryAttempted.current = true;
          const recovered = await loadPersistedSession();
          if (!recovered) {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session) {
          try {
            const { data, error } = await api.auth.me();
            if (error || !data) {
              console.error('Error loading user data on auth change:', error);
              setIsLoading(false);
              return;
            }
            
            setUser(data);
            
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              session,
              user: data
            }));
          } catch (error) {
            console.error('Error during auth change:', error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setUser(null);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  const loadPersistedSession = async () => {
    try {
      const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (storedData) {
        const { session: storedSession, user: storedUser } = JSON.parse(storedData);
        
        if (storedSession && storedUser) {
          // Validate stored session
          const { data: { session: validSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Failed to validate stored session:', error);
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setIsLoading(false);
            return false;
          }
          
          if (validSession) {
            setSession(storedSession);
            setUser(storedUser);
            setIsLoading(false);
            return true;
          } else {
            console.log('Stored session is invalid, removing');
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error loading persisted session:', error);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setIsLoading(false);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setSession(null);
    } catch (error) {
      throw error;
    }
  };

  const logNavigationEvent = (action: string, destination: string, details: Record<string, unknown> = {}) => {
    console.log(`[Navigation] ${action} to ${destination}`, details);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};