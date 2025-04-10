import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomPhoneInput, { CustomPhoneInputRef } from '../components/CustomPhoneInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

type ReadingType = {
  id: string;
  title: string;
  selected: boolean;
};

const introSlides = [
  {
    id: '1',
    title: 'Your Personal Coach',
    description: 'Get personalized coaching from expert trainers for just $0.99.',
    icon: '⚽',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Expert Coaching Insights',
    description: 'Access professional training programs and personalized workout plans.',
    icon: '🏀',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Your Fitness Journey Begins',
    description: 'Connect with expert coaches or explore AI training programs – the choice is yours!',
    icon: '🎾',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop',
  },
];

export default function OnboardingRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new onboarding selection screen
    router.replace('/onboarding-select');
  }, [router]);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  introContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  slide: {
    width,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  slideImage: {
    width: '100%',
    height: Platform.OS === 'ios' ? '65%' : '60%',
    resizeMode: 'cover',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginTop: Platform.OS === 'ios' ? 20 : 16,
  },
  slideContent: {
    flex: 1,
    padding: Platform.OS === 'ios' ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  slideIcon: {
    fontSize: Platform.OS === 'ios' ? 56 : 48,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideTitle: {
    fontSize: Platform.OS === 'ios' ? 32 : 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    letterSpacing: -0.5,
    paddingHorizontal: 16,
  },
  slideDescription: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 26 : 24,
    marginTop: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 20,
    maxWidth: 500,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: '#ffffff',
    marginTop: Platform.OS === 'ios' ? 12 : 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: '#6366f1',
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  introButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: Platform.OS === 'ios' ? 56 : 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: Platform.OS === 'ios' ? 56 : 48,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  header: {
    marginBottom: Platform.OS === 'ios' ? 32 : 28,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 40 : 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Platform.OS === 'ios' ? 22 : 20,
    color: '#4b5563',
    marginTop: Platform.OS === 'ios' ? 12 : 10,
    lineHeight: Platform.OS === 'ios' ? 32 : 28,
    letterSpacing: -0.3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: Platform.OS === 'ios' ? 16 : 14,
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    marginLeft: 12,
    marginTop: 2,
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
  },
  inputContainer: {
    gap: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 20 : 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 16 : 14,
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  phoneContainer: {
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 16 : 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  phoneTextInput: {
    color: '#1a1a1a',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    backgroundColor: '#ffffff',
  },
  readingTypes: {
    gap: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: Platform.OS === 'ios' ? 8 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  typeButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  typeButtonText: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: '#1a1a1a',
    marginTop: 0,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    padding: Platform.OS === 'ios' ? 24 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    gap: Platform.OS === 'ios' ? 16 : 14,
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 16 : 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: Platform.OS === 'ios' ? 56 : 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  webDatePickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nativeDatePickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 24 : 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nativeDatePicker: {
    height: Platform.OS === 'ios' ? 120 : 100,
    marginTop: Platform.OS === 'ios' ? 16 : 14,
  },
  datePickerLabel: {
    color: '#1a1a1a',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    marginTop: Platform.OS === 'ios' ? 8 : 6,
    letterSpacing: -0.3,
  },
  accountPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Platform.OS === 'ios' ? 8 : 6,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    marginTop: Platform.OS === 'ios' ? 16 : 14,
    backgroundColor: '#ffffff',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  accountPromptText: {
    color: '#4b5563',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    fontWeight: '500',
  },
  loginLinkText: {
    color: '#6366f1',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
