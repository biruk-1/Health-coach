// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from './../../context/AuthContext';
import { api } from './../../services/api';
import { supabase } from './../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { usePurchases } from '../../context/PurchaseContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, session, updateUserState } = useAuth();
  const { balance, refreshBalance } = usePurchases();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const loadAttempts = useRef(0);
  const isUnmounted = useRef(false);
  
  // Track original values to detect changes
  const [originalForm, setOriginalForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: new Date(),
    birthTime: new Date(),
    birthLocation: '',
  });
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: new Date(),
    birthTime: new Date(),
    birthLocation: '',
  });

  // Add a state to track authentication failure
  const [authFailed, setAuthFailed] = useState(false);

  // Function to check if a field has been modified
  const isFieldModified = (field: string) => {
    // Email changes are disabled, so always return false for email
    if (field === 'email') {
      return false;
    }
    
    // @ts-ignore
    if (field === 'birthDate' || field === 'birthTime') {
      // For date objects, compare ISO strings
      // @ts-ignore
      const originalDate = originalForm[field]?.toISOString();
      // @ts-ignore
      const currentDate = form[field]?.toISOString();
      return originalDate !== currentDate;
    }
    // @ts-ignore
    return originalForm[field] !== form[field];
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!user || !user.id) {
      setAuthFailed(true);
      setLoading(false);
      return;
    }
    
    // Set cleanup function to prevent state updates after unmount
    return () => {
      isUnmounted.current = true;
    };
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      loadUserData();
      refreshBalance();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Prevent excessive load attempts
      if (loadAttempts.current >= 2) {
        console.log('Maximum load attempts reached, stopping to prevent infinite loop');
        setLoading(false);
        return false;
      }
      
      loadAttempts.current += 1;
      setLoading(true);
      
      // Make sure we have a user
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      console.log('Loading user data for user ID:', user.id, 'Attempt:', loadAttempts.current);
      
      // Use user metadata directly when possible
      if (user.fullName) {
        console.log('Using cached user data from auth context');
        const updatedForm = {
          fullName: user.fullName || '',
          email: user.email || '',
          phone: '',
          birthDate: new Date(),
          birthTime: new Date(),
          birthLocation: '',
        };
        
        if (!isUnmounted.current) {
          setOriginalForm({ ...updatedForm });
          setForm({ ...updatedForm });
        }
        
        setLoading(false);
        return true;
      }
      
      // Only make API call if we don't have the data already
      const response = await api.auth.me();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const userData = response.data;
      if (!userData) throw new Error('No user data received');

      console.log('User data received:', JSON.stringify(userData));

      // Parse dates and times properly
      let birthDate = new Date();
      if (userData.birthDate) {
        try {
          birthDate = new Date(userData.birthDate);
          console.log('Parsed birth date:', birthDate);
        } catch (e) {
          console.error('Failed to parse birth date:', userData.birthDate, e);
        }
      }
      
      // If birthTime is a string (HH:MM:SS format), convert it to a Date object
      let birthTime = new Date();
      if (userData.birthTime) {
        try {
          if (typeof userData.birthTime === 'string') {
            // Handle different time formats
            if (userData.birthTime.includes(':')) {
              const [hours, minutes, seconds] = userData.birthTime.split(':').map(Number);
              birthTime = new Date();
              birthTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);
            } else {
              // If it's an ISO string
              birthTime = new Date(userData.birthTime);
            }
          } else if (userData.birthTime instanceof Date) {
            birthTime = userData.birthTime;
          }
          console.log('Parsed birth time:', birthTime);
        } catch (e) {
          console.error('Failed to parse birth time:', userData.birthTime, e);
        }
      }
      
      // Update form with current user data
      const updatedForm = {
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: isNaN(birthDate.getTime()) ? new Date() : birthDate,
        birthTime: isNaN(birthTime.getTime()) ? new Date() : birthTime,
        birthLocation: userData.birthLocation || '',
      };

      console.log('Setting form data to:', JSON.stringify(updatedForm));
      
      // Check if component is still mounted before updating state
      if (!isUnmounted.current) {
        // Store the original form data for change detection
        setOriginalForm({ ...updatedForm });
        
        // Force a form update by creating a new object
        setForm({ ...updatedForm });
      }
      
      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('authentication') || error.message.includes('authenticated'))) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => router.navigate('/login') }]
        );
      } else {
        Alert.alert('Error', 'Failed to load account information: ' + error.message);
      }
      return false;
    } finally {
      if (!isUnmounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Make sure we have a user
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Validate form data
      if (!form.fullName.trim()) {
        throw new Error('Please enter your full name');
      }
      
      if (!form.email.trim()) {
        throw new Error('Please enter your email address');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Prepare the update payload with all form values except email
      // We're using the original email to ensure no email changes are processed
      const updatePayload = {
        fullName: form.fullName,
        email: originalForm.email, // Always use the original email
        phone: form.phone,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        birthLocation: form.birthLocation,
      };

      console.log('Submitting form data for update:', JSON.stringify(updatePayload));

      // Call the API to update the profile
      const response = await api.users.updateProfile(updatePayload);

      // Check for success flag or errors
      if (!response.success || response.error) {
        // Special handling for SMS provider errors
        if (response.error?.message.includes('SMS provider')) {
          throw new Error('Phone number update failed. The app is not configured for SMS verification yet, but your other changes have been saved.');
        }
        throw new Error(response.error?.message || 'Failed to update profile');
      }

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        // Get the latest user data from Supabase to update the UI
        const { data: { user: updatedSupabaseUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting updated user:', userError);
        } else if (updatedSupabaseUser) {
          // Update local state immediately with new user data
          updateUserState(updatedSupabaseUser);
        }
        
        // Try to reload user data to confirm changes, but don't fail if this doesn't work
        console.log('Update successful, attempting to reload user data to confirm changes...');
        const success = await loadUserData();
        
        if (!success) {
          console.log('Could not reload user data, but your changes have been saved.');
        }
      } catch (reloadError) {
        // Don't throw an error here, just log it
        console.warn('Could not verify profile update, but your changes have been saved:', reloadError);
      }

      // Show success message regardless of verification result
      Alert.alert(
        'Success', 
        'Your profile has been updated successfully', 
        [{ text: 'OK' }]
      );
      
      // Update the form's original values to match the current values to prevent
      // the modified state from persisting unnecessarily
      setOriginalForm({ ...form });
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('authentication') || error.message.includes('authenticated'))) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => router.navigate('/login') }]
        );
      } else {
        Alert.alert(
          'Update Failed',
          error.message || 'Unable to save your changes. Please try again.',
          [
            { text: 'Retry', onPress: handleSave },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  };

  const handleBack = () => {
    if (saving) return;
    router.navigate('/(tabs)/settings');
  };

  const renderCustomHeader = () => (
    <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#0a0a0a" />
    </TouchableOpacity>
  );

  const renderFormField = (label: string, value: string, onChange: (text: string) => void, placeholder: string, fieldName: string, keyboardType = 'default') => (
    <View style={styles.formGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
          styles.currentValue,
          // @ts-ignore
          isFieldModified(fieldName) && styles.modifiedValue
        ]}>
          {value ? (isFieldModified(fieldName) ? 'Changed from: ' : 'Current: ') + (originalForm[fieldName] || 'Not set') : 'Not set'}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          // @ts-ignore
          isFieldModified(fieldName) && styles.modifiedInput
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderPhoneField = () => (
    <View style={styles.formGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <Text style={[
          styles.currentValue,
          isFieldModified('phone') && styles.modifiedValue
        ]}>
          {form.phone ? (isFieldModified('phone') ? 'Changed from: ' : 'Current: ') + (originalForm.phone || 'Not set') : 'Not set'}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input, 
          isFieldModified('phone') && styles.modifiedInput
        ]}
        value={form.phone}
        onChangeText={(text) => setForm({ ...form, phone: text })}
        placeholder="Enter your phone number"
        placeholderTextColor="#94a3b8"
        keyboardType="phone-pad"
      />
      <Text style={styles.phoneNote}>
        Note: Phone number changes require SMS verification and may not apply immediately.
      </Text>
    </View>
  );

  // Add a function to handle logout and redirect to login
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.navigate('/login');
    }
  };

  // If authentication has failed, show a login prompt instead of loading forever
  if (authFailed) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Account',
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#121212" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.authErrorContainer}>
          <Text style={styles.authErrorTitle}>Authentication Required</Text>
          <Text style={styles.authErrorText}>
            You need to be logged in to access your account settings.
          </Text>
          <TouchableOpacity 
            style={styles.authErrorButton} 
            onPress={() => router.navigate('/login')}
          >
            <Text style={styles.authErrorButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Account',
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#121212" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Account',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#121212" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Manage your account details</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.creditBalanceContainer}>
            <Ionicons name="wallet-outline" size={24} color="#6366f1" />
            <Text style={styles.creditBalanceText}>Credit Balance: <Text style={styles.creditAmount}>{balance}</Text></Text>
          </View>

          {renderFormField(
            'Full Name', 
            form.fullName,
            (text) => setForm({ ...form, fullName: text }),
            'Enter your full name',
            'fullName'
          )}

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.currentValue}>Current: {form.email}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={form.email}
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              editable={false}
            />
            <Text style={styles.phoneNote}>
              Email updates are temporarily disabled.
            </Text>
          </View>

          {renderPhoneField()}

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Birth Date</Text>
              <Text style={[
                styles.currentValue,
                isFieldModified('birthDate') && styles.modifiedValue
              ]}>
                {form.birthDate ? 
                  (isFieldModified('birthDate') ? 'Changed from: ' : 'Current: ') + 
                  formatDate(originalForm.birthDate) : 'Not set'}
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <View style={[
                styles.webDatePickerContainer,
                isFieldModified('birthDate') && styles.modifiedInput
              ]}>
                <input
                  type="date"
                  value={form.birthDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) setForm({ ...form, birthDate: newDate });
                  }}
                  style={styles.webInput}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton, 
                    isFieldModified('birthDate') && styles.modifiedInput
                  ]} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>{formatDate(form.birthDate)}</Text>
                  <Ionicons 
                    name="calendar" 
                    size={20} 
                    color={isFieldModified('birthDate') ? "#f59e0b" : "#6366f1"} 
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={form.birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="dark"
                    textColor="#ffffff"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate && !isNaN(selectedDate.getTime())) setForm({ ...form, birthDate: selectedDate });
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                    }}
                  />
                )}
                {showDatePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.confirmButton} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Birth Time</Text>
              <Text style={[
                styles.currentValue,
                isFieldModified('birthTime') && styles.modifiedValue
              ]}>
                {form.birthTime ? 
                  (isFieldModified('birthTime') ? 'Changed from: ' : 'Current: ') + 
                  formatTime(originalForm.birthTime) : 'Not set'}
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <View style={[
                styles.webDatePickerContainer,
                isFieldModified('birthTime') && styles.modifiedInput
              ]}>
                <input
                  type="time"
                  value={form.birthTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(form.birthTime);
                    newTime.setHours(parseInt(hours, 10));
                    newTime.setMinutes(parseInt(minutes, 10));
                    newTime.setSeconds(0);
                    if (!isNaN(newTime.getTime())) setForm({ ...form, birthTime: newTime });
                  }}
                  style={styles.webInput}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton, 
                    isFieldModified('birthTime') && styles.modifiedInput
                  ]} 
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>{formatTime(form.birthTime)}</Text>
                  <Ionicons 
                    name="time" 
                    size={20} 
                    color={isFieldModified('birthTime') ? "#f59e0b" : "#6366f1"} 
                  />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={form.birthTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="dark"
                    textColor="#ffffff"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime && !isNaN(selectedTime.getTime())) setForm({ ...form, birthTime: selectedTime });
                      if (Platform.OS !== 'ios') setShowTimePicker(false);
                    }}
                  />
                )}
                {showTimePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.confirmButton} onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {renderFormField(
            'Birth Location', 
            form.birthLocation,
            (text) => setForm({ ...form, birthLocation: text }),
            'City, Country',
            'birthLocation'
          )}
        </View>

        {(isFieldModified('fullName') || isFieldModified('email') || isFieldModified('phone') || 
          isFieldModified('birthDate') || isFieldModified('birthTime') || isFieldModified('birthLocation')) ? (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Changes</Text>
                <Ionicons name="save-outline" size={20} color="#ffffff" style={styles.saveButtonIcon} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.noChangesContainer}>
            <Text style={styles.noChangesText}>Make changes to save your profile</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Please ensure all information is accurate before saving.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 19,
    color: '#161616',
    marginLeft:'15%',
    fontWeight:'700'
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 19,
    color: '#161616',
    marginBottom: 12,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    color: '#1e293b',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePickerButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePickerButtonText: {
    color: '#1e293b',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonIcon: {
    marginLeft: 8,
  },
  infoSection: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  infoText: {
    color: '#0369a1',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#1e293b',
    fontSize: 16,
    marginTop: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  webDatePickerContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 12,
    color: '#6366f1',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  phoneNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modifiedValue: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  modifiedInput: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
  },
  noChangesContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  noChangesText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  authErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  authErrorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  authErrorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  authErrorButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  authErrorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldValue: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#222222',
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  creditBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  creditBalanceText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  creditAmount: {
    fontWeight: '700',
    color: '#6366f1',
  },
  dateTimeField: {
    // ... existing code ...
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
});
