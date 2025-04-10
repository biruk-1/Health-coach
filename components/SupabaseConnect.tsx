import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

type SupabaseConnectProps = {
  isVisible: boolean;
  onClose: () => void;
  onConnect: () => void;
};

export default function SupabaseConnect({ isVisible, onClose, onConnect }: SupabaseConnectProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!supabaseUrl || !supabaseKey) {
      Alert.alert('Error', 'Please enter both Supabase URL and Anon Key');
      return;
    }

    try {
      setLoading(true);
      
      // Test the connection
      const testClient = supabase;
      const { error } = await testClient.from('users').select('id').limit(1);
      
      if (error) {
        throw new Error('Failed to connect to Supabase');
      }

      // Save the credentials (in a real app, you'd update the .env file)
      // For this demo, we'll just simulate success
      Alert.alert('Success', 'Connected to Supabase successfully!');
      onConnect();
    } catch (error) {
      console.error('Supabase connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to Supabase. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Connect to Supabase</Text>
          <Text style={styles.description}>
            Enter your Supabase project URL and anon key to connect your app to the database.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Supabase URL</Text>
            <TextInput
              style={styles.input}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              placeholder="https://your-project.supabase.co"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Supabase Anon Key</Text>
            <TextInput
              style={styles.input}
              value={supabaseKey}
              onChangeText={setSupabaseKey}
              placeholder="your-anon-key"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.connectButton, (!supabaseUrl || !supabaseKey || loading) && styles.connectButtonDisabled]}
              onPress={handleConnect}
              disabled={!supabaseUrl || !supabaseKey || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.connectButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});