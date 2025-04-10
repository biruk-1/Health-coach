import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that the environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.log('Available env variables:', Object.keys(process.env).filter(key => key.startsWith('EXPO_')));
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

// Log full environment variables in development for debugging
console.log('[Supabase] Environment:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey.substring(0, 10) + '...',
  isDev: process.env.NODE_ENV === 'development'
});

// Custom storage implementation to debug session persistence
const customStorage = {
  ...AsyncStorage,
  setItem: async (key: string, value: string) => {
    console.log(`[Storage] Setting ${key}:`, value.substring(0, 50) + '...');
    return AsyncStorage.setItem(key, value);
  },
  getItem: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    console.log(`[Storage] Getting ${key}:`, value ? 'exists' : 'not found');
    return value;
  },
  removeItem: async (key: string) => {
    console.log(`[Storage] Removing ${key}`);
    return AsyncStorage.removeItem(key);
  }
};

// Initialize the Supabase client with persistent storage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: true, // Enable debug mode always for auth issues
  },
});

// Test the connection
const testConnection = async () => {
  try {
    console.log('[Supabase] Testing connection...');
    const { data, error } = await supabase.from('health_coaches').select('count');
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
    } else {
      console.log('[Supabase] Connection successful:', data);
    }
  } catch (err) {
    console.error('[Supabase] Connection test error:', err);
  }
};

// Log the connection details for debugging
console.log(`[Supabase] Connecting to: ${supabaseUrl}`);
console.log(`[Supabase] Using Anon Key: ${supabaseAnonKey.substring(0, 10)}...`);

// Add session state listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state changed:', event, session ? 'Session exists' : 'No session');
});

// Test the connection after a short delay
setTimeout(testConnection, 2000);