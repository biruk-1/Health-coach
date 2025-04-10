import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: new Date(),
    birthTime: new Date(),
    birthLocation: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await api.auth.me();
      if (!userData) throw new Error('No user data received');

      const birthDate = userData.birthDate ? new Date(userData.birthDate) : new Date();
      const birthTime = userData.birthTime 
        ? new Date(`1970-01-01T${userData.birthTime}`) 
        : new Date();

      const updatedForm = {
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: isNaN(birthDate.getTime()) ? new Date() : birthDate,
        birthTime: isNaN(birthTime.getTime()) ? new Date() : birthTime,
        birthLocation: userData.birthLocation || '',
      };

      setForm(updatedForm);
      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load account information');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatePayload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        birthLocation: form.birthLocation,
      };

      console.log('Attempting to update profile with:', updatePayload);

      const response = await api.users.updateProfile(updatePayload);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }

      const success = await loadUserData();
      if (!success) throw new Error('Failed to verify profile update');

      Alert.alert('Success', 'Your profile has been updated successfully', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Unable to save your changes. Please try again.',
        [
          { text: 'Retry', onPress: handleSave },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
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
    router.push('/(tabs)/settings');
  };

  const renderCustomHeader = () => (
    <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#0a0a0a" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading account information...</Text>
      </View>
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
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Birth Date</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webDatePickerContainer}>
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
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.datePickerButtonText}>{formatDate(form.birthDate)}</Text>
                  <Ionicons name="calendar" size={20} color="#6366f1" />
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
            <Text style={styles.label}>Birth Time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webDatePickerContainer}>
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
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.datePickerButtonText}>{formatTime(form.birthTime)}</Text>
                  <Ionicons name="time" size={20} color="#6366f1" />
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Birth Location</Text>
            <TextInput
              style={styles.input}
              value={form.birthLocation}
              onChangeText={(text) => setForm({ ...form, birthLocation: text })}
              placeholder="City, Country"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

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
});