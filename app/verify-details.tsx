// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { searchPsychicByPhone } from '../services/database';
import { trackEvent } from '../lib/posthog';
import { verifyCode } from '../services/twilio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phone, verificationId } = params;
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [businessDetails, setBusinessDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('psychics').select('id').limit(1);
        setIsSupabaseConnected(!error && data !== null);
      } catch (err) {
        console.log('Supabase connection error:', err);
        setIsSupabaseConnected(false);
      }
    };
    checkSupabaseConnection();
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchBusinessDetails = async () => {
      try {
        const cleanedPhone = phone ? String(phone).replace(/\D/g, '') : '';
        console.log("Searching for phone:", cleanedPhone);
        trackEvent('psychic_verification_attempt', { phone_number_length: cleanedPhone.length });
        
        const psychic = await searchPsychicByPhone(cleanedPhone);
        if (psychic) {
          setBusinessDetails({
            id: psychic.id,
            phone: psychic.phone,
            name: psychic.fullName,
            address: psychic.address,
            city: psychic.location,
            website: psychic.website,
            image: psychic.profileImage
          });
          setError(null);
          trackEvent('psychic_verification_success', { psychic_id: psychic.id });
        } else {
          setBusinessDetails(null);
          setError('We do not have your phone number on file. Please check the number and try again.');
          trackEvent('psychic_verification_failed', { reason: 'no_match', phone_entered: cleanedPhone });
        }
      } catch (err) {
        console.error('Error fetching business details:', err);
        setError('An error occurred while verifying your business. Please try again.');
        trackEvent('psychic_verification_error', { error: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };
    setTimeout(() => fetchBusinessDetails(), 1000);
  }, [phone, isSupabaseConnected]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }
    if (!verificationId) {
      setVerificationError('Verification session expired. Please try again.');
      return;
    }
    
    setVerifying(true);
    setVerificationError(null);
    
    try {
      const result = await verifyCode(verificationId as string, verificationCode);
      if (result.success) {
        setIsVerified(true);
        trackEvent('phone_verification_success', { psychic_id: businessDetails?.id });
        
        if (isSupabaseConnected && businessDetails?.id) {
          const { error: updateError } = await supabase
            .from('psychics')
            .update({ is_verified: true })
            .eq('id', businessDetails.id);
          if (updateError) {
            console.error('Error updating verification status:', updateError);
            trackEvent('verification_status_update_error', { psychic_id: businessDetails.id, error: updateError.message });
          } else {
            trackEvent('verification_status_updated', { psychic_id: businessDetails.id });
          }
        }
        
        Alert.alert(
          'Verification Successful',
          'Your phone number has been verified successfully!',
          [{ text: 'Continue', onPress: () => router.navigate('/verify-success') }]
        );
      } else {
        setVerificationError(result.error || 'Invalid verification code');
        trackEvent('phone_verification_failed', { error: result.error });
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setVerificationError('Failed to verify code. Please try again.');
      trackEvent('phone_verification_error', { error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = () => {
    if (isVerified) {
      trackEvent('psychic_verification_completed', { psychic_id: businessDetails?.id });
      router.navigate('/verify-success');
    } else {
      handleVerifyCode();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Finding your business...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !businessDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Business Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'We do not have your phone number on file. Please check the number and try again.'}</Text>
          <Text style={styles.phoneDebug}>You entered: {formatPhoneNumber(String(phone).replace(/\D/g, ''))}</Text>
          <TouchableOpacity style={styles.backToVerifyButton} onPress={() => router.back()}>
            <Text style={styles.backToVerifyButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Business</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingBottom: Math.max(insets.bottom + 60, 80) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={64} color="#6366f1" />
        </View>

        <Text style={styles.description}>
          We found your business listing. Please verify the details below are correct.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Business Name</Text>
            <Text style={styles.detailValue}>{businessDetails.name}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{businessDetails.address || 'Not available'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>City</Text>
            <Text style={styles.detailValue}>{businessDetails.city || 'Not available'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Website</Text>
            <Text style={styles.detailValue}>{businessDetails.website || 'Not available'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{formatPhoneNumber(businessDetails.phone)}</Text>
          </View>
        </View>

        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>Phone Verification</Text>
          <Text style={styles.verificationText}>
            Enter the verification code sent to your phone number to complete the verification process.
          </Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter verification code"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
            />
            {verificationError && (
              <Text style={styles.verificationErrorText}>{verificationError}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <Text style={styles.infoText}>
            By verifying and claiming this listing, you confirm that you are the owner or authorized representative of this business.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>
                {isVerified ? 'Continue' : 'Verify & Claim Business'}
              </Text>
              <Ionicons 
                name={isVerified ? "arrow-forward" : "checkmark-circle"} 
                size={24} 
                color="#ffffff" 
                style={styles.verifyButtonIcon} 
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatPhoneNumber(phoneNumberString: string) {
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumberString;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#1e293b',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#1e293b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  phoneDebug: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  backToVerifyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backToVerifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  verificationSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  verificationText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 16,
  },
  codeInputContainer: {
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    color: '#1e293b',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verificationErrorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoText: {
    flex: 1,
    color: '#0369a1',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonIcon: {
    marginLeft: 8,
  },
});
