// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import CustomPhoneInput, { CustomPhoneInputRef } from '../components/CustomPhoneInput';
import { sendVerificationCode } from '../services/twilio';
import { trackEvent } from '../lib/posthog';

export default function VerifyPsychicScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneInputRef = useRef<CustomPhoneInputRef>(null);

  const handleSubmit = async () => {
    try {
      if (!phone || !phoneInputRef.current?.isValidNumber(phone)) {
        setError('Please enter a valid phone number');
        console.log('Invalid phone number entered:', phone);
        return;
      }
      setIsLoading(true);
      setError(null);
      console.log('Submitting phone number:', phone);
      trackEvent('psychic_verification_attempt', { phone_number: phone });

      // Call Twilio to send verification code
      console.log('[Twilio] Initiating verification code request for:', phone);
      const result = await sendVerificationCode(phone);
      console.log('[Twilio] Verification result:', result);

      if (result.success && result.verificationId) {
        console.log('[Twilio] Verification code sent successfully. Verification ID:', result.verificationId);
        trackEvent('verification_code_sent', { success: true, verificationId: result.verificationId });
        router.navigate({
          pathname: '/verify-details',
          params: { phone, verificationId: result.verificationId }
        });
      } else {
        console.warn('[Twilio] Failed to send verification code:', result.error);
        trackEvent('verification_code_sent', { success: false, error: result.error });
        setError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('[Twilio] Verification error:', error);
      setError('An unexpected error occurred. Please try again.');
      trackEvent('verification_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Static Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Your Business</Text>
      </View>

      {/* Scrollable Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#6366f1" />
          </View>

          <Text style={styles.description}>
            To verify your Phone number: please enter the phone number associated with your{' '}
            <Text style={styles.boldText}>Google Maps</Text>
          </Text>

          <View style={styles.phoneContainer}>
            <Text style={styles.label}>Business Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <CustomPhoneInput
                ref={phoneInputRef}
                defaultValue={phone}
                defaultCode="US"
                onChangeFormattedText={setPhone}
                containerStyle={styles.phoneContainer}
                textInputStyle={styles.phoneTextInput}
                placeholder="XX-XXX-XXXX"
              />
            </View>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => Linking.openURL('mailto:support@yourapp.com')}>
                  <Text style={styles.supportLink}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.verificationContainer}>
            <Text style={styles.verificationTitle}>How Verification Works</Text>
            <Text style={styles.verificationText}>
              After submitting your phone number, you'll receive a verification code. Enter this code on
              the next screen to verify your business.
            </Text>
          </View>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Requirements</Text>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.requirementText}>
                Must be the business owner or authorized representative
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.requirementText}>Phone number must match our records</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.requirementText}>Business must be legitimate and operational</Text>
            </View>
          </View>
        </ScrollView>

        {/* Static Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Verification Code</Text>
                  <Ionicons name="arrow-forward" size={24} color="#ffffff" style={styles.submitButtonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  phoneContainer: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  phoneInputContainer: {
    marginBottom: 8,
  },
  phoneTextInput: {
    color: '#1e293b',
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  supportLink: {
    color: '#6366f1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  verificationContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  requirements: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementText: {
    color: '#64748b',
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonIcon: {
    marginLeft: 8,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
});
