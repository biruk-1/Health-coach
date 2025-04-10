import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import SupabaseConnect from './SupabaseConnect';
import { initializeDatabase } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    getDatabaseSize();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Checking Supabase connection...');
      const { data, error } = await supabase.from('health_coaches').select('id').limit(1);
      console.log('Connection check:', data, error);
      setIsConnected(!error);
      if (error) {
        setDebugInfo(`Connection error: ${error.message}`);
      } else if (data && data.length > 0) {
        setDebugInfo(`Connected successfully. Found ${data.length} records.`);
      } else {
        setDebugInfo('Connected but no records found');
      }
    } catch (error) {
      console.error('Database connection check failed:', error);
      setIsConnected(false);
      setDebugInfo(`Connection check exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getDatabaseSize = async () => {
    try {
      // For Supabase, we'd need to query the database size
      // For now, we'll just use a mock value
      const mockSize = Math.floor(Math.random() * 15000) + 10000;
      setDatabaseSize(mockSize);
    } catch (error) {
      console.error('Failed to get database size:', error);
    }
  };

  const handleConnect = () => {
    setShowConnectModal(true);
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    checkConnection();
  };

  const handleInitializeDatabase = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Initializing database...');
      await initializeDatabase();
      await getDatabaseSize();
      setDebugInfo('Database initialization complete');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setDebugInfo(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const clearSupabaseCache = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Clearing Supabase cache...');
      await supabase.auth.signOut();
      
      // Clear AsyncStorage items related to Supabase
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('sb-')
      );
      
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        setDebugInfo(`Cache cleared (${supabaseKeys.length} items). Refreshing connection...`);
      } else {
        setDebugInfo('No cache items found. Refreshing connection...');
      }
      
      await checkConnection();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setDebugInfo(`Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Testing full database query...');
      const { data, error } = await supabase
        .from('health_coaches')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('Database test failed:', error);
        setDebugInfo(`Database test error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Database test successful:', data.length, 'records');
        setDebugInfo(`Found ${data.length} records. First record: ${data[0].name}`);
      } else {
        setDebugInfo('Database is empty. No records found.');
      }
    } catch (error) {
      console.error('Database test exception:', error);
      setDebugInfo(`Database test exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={styles.loadingText}>
          {debugInfo || 'Checking database connection...'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {isConnected ? (
          <View style={styles.statusContainer}>
            <View style={styles.connectedIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.connectedText}>Connected to Supabase</Text>
            {databaseSize && (
              <Text style={styles.databaseSizeText}>
                {databaseSize.toLocaleString()} records
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <View style={styles.disconnectedIcon}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
            </View>
            <Text style={styles.disconnectedText}>Not connected to Supabase</Text>
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {debugInfo && (
          <Text style={styles.debugText}>{debugInfo}</Text>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleInitializeDatabase}
          >
            <Text style={styles.actionButtonText}>Initialize DB</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={clearSupabaseCache}
          >
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={testDatabaseConnection}
          >
            <Text style={styles.actionButtonText}>Test DB</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SupabaseConnect
        isVisible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  connectedIcon: {
    marginRight: 8,
  },
  disconnectedIcon: {
    marginRight: 8,
  },
  connectedText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectedText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  databaseSizeText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
  },
  initializeButton: {
    backgroundColor: '#4b5563',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 8,
  },
  initializeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  debugText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#4b5563',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});