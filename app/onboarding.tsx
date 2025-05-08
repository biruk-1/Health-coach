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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type ReadingType = {
  id: string;
  title: string;
  selected: boolean;
};

type IntroSlide = {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
};

const introSlides: IntroSlide[] = [
  {
    id: '1',
    title: 'Your Personal Health Journey',
    description: 'Begin your path to wellness with personalized health coaching and nutrition guidance.',
    icon: '🍎',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Expert Health Insights',
    description: 'Get professional guidance on nutrition, fitness, and mindfulness for optimal wellness.',
    icon: '💪',
    image: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Track Your Wellness Progress',
    description: 'Monitor your health metrics, achieve your goals, and celebrate your wellness milestones.',
    icon: '📊',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const auth = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: new Date(),
    height: '',
    role: 'user' as 'user' | 'psychic',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    phone: '',
    height: '',
  });
  const phoneInput = useRef<CustomPhoneInputRef>(null);
  const flatListRef = useRef<FlatList>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const [coachingTypes, setCoachingTypes] = useState<ReadingType[]>([
    { id: '1', title: 'Nutrition', selected: false },
    { id: '2', title: 'Fitness', selected: false },
    { id: '3', title: 'Weight Management', selected: false },
    { id: '4', title: 'Mental Wellness', selected: false },
    { id: '5', title: 'Stress Reduction', selected: false },
    { id: '6', title: 'Healthy Aging', selected: false },
    { id: '7', title: 'Sleep Health', selected: false },
    { id: '8', title: 'Chronic Disease', selected: false },
    { id: '9', title: 'Diabetes Management', selected: false },
    { id: '10', title: 'Heart Health', selected: false },
    { id: '11', title: 'Digestive Health', selected: false },
    { id: '12', title: 'Women\'s Health', selected: false },
    { id: '13', title: 'Men\'s Health', selected: false },
  ]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    if (password.length < 6) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
      return false;
    }
    if (password !== confirmPassword) {
      setFormErrors(prev => ({ ...prev, password: 'Passwords do not match' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phoneInput.current?.isValidNumber(phone)) {
      setFormErrors(prev => ({ ...prev, phone: 'Please enter a valid US or Canada phone number' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, phone: '' }));
    return true;
  };

  const toggleReadingType = (id: string) => {
    setCoachingTypes(types =>
      types.map(type =>
        type.id === id ? { ...type, selected: !type.selected } : type
      )
    );
  };

  const handleLoginRedirect = () => {
    if (!loading) {
      router.push('/login');
    }
  };

  const handleBack = () => {
    if (loading) return;
    
    if (step > 1 && !showIntro) {
      setStep(prevStep => prevStep - 1);
    } else if (showIntro) {
      if (currentSlide > 0) {
        handleManualSlideChange(currentSlide - 1);
      } else {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleNext = async () => {
    if (loading || isNavigating) return;
    
    // Special handling for intro slides
    if (showIntro) {
      if (currentSlide < introSlides.length - 1) {
        handleManualSlideChange(currentSlide + 1);
      } else {
        setShowIntro(false);
        setStep(1);
        // Clear any previous errors when starting the form
        setError(null);
        setFormErrors({ email: '', password: '', phone: '', height: '' });
      }
      return;
    }
    
    // For steps before the final step, just move to the next step
    if (step < 7) {
      // Only validate the current step before moving forward
      let canProceed = true;
      
      // Validate based on current step
      if (step === 2 && form.email) {
        canProceed = validateEmail(form.email);
      } else if (step === 3 && form.password) {
        canProceed = validatePassword(form.password, form.confirmPassword);
      } else if (step === 4 && form.phone) {
        canProceed = validatePhone(form.phone);
      } else if (step === 6 && form.height) {
        canProceed = true;
      }
      
      if (canProceed) {
        setStep(prevStep => prevStep + 1);
        // Clear any step-specific errors when moving forward
        setError(null);
      }
      return;
    }
    
    // Final step - registration
    if (step === 7) {
      try {
        // Do final validation of all required fields silently (don't show errors yet)
        if (!form.fullName || !form.email || !form.password) {
          setError('Please make sure all required information is completed before registering.');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        console.log('Attempting registration with complete form data');
        
        // Check if auth context is properly initialized
        if (!auth || !auth.register) {
          throw new Error('Authentication service is not available. Please try again later.');
        }
        
        const registerResult = await auth.register({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role
        });

        if (registerResult.success) {
          console.log('Registration successful, updating profile');
          
          // Save additional profile data
          await api.users.updateProfile({
            birthDate: form.birthDate,
            height: form.height,
            interests: coachingTypes
              .filter(type => type.selected)
              .map(type => type.title)
          });

          // IMPORTANT: Don't mark onboarding as complete yet!
          // The user needs to go through onboarding-select to choose whether
          // they're a coach or a user, then complete that specific onboarding
          
          console.log('Registration successful! Setting up navigation...');
          
          // Force clear onboarding status to make sure they go through the selection process
          await AsyncStorage.removeItem('onboarded');
          await AsyncStorage.removeItem('userType');
          
          // Create a strong navigation lock that prevents ANY redirects
          const lockTimestamp = Date.now();
          await AsyncStorage.setItem('registration_status', `new_${lockTimestamp}`);
          await AsyncStorage.setItem('navigation_lock', `strict_${lockTimestamp}`);
          await AsyncStorage.setItem('last_navigation_timestamp', lockTimestamp.toString());
          
          // Set navigation flag to prevent multiple redirects
          setIsNavigating(true);
          
          // Add a short delay before navigation to ensure AsyncStorage updates are processed
          setTimeout(async () => {
            try {
              console.log('Navigating to onboarding-select with strict navigation lock');
              // Use replace to clear navigation history and prevent back navigation issues
              router.replace('/onboarding-select');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          }, 500);
        } else {
          handleRegistrationError(registerResult.error);
        }
      } catch (error) {
        console.error('Registration error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred during registration');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Let's start with your name";
      case 2:
        return "What's your email?";
      case 3:
        return "Create a password";
      case 4:
        return "Add your phone number";
      case 5:
        return "When were you born?";
      case 6:
        return "What is your height?";
      case 7:
        return "What coaching are you interested in?";
      default:
        return "";
    }
  };

  const handleManualSlideChange = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentSlide(index);
  };

  const handlePasswordChange = (text: string) => {
    setForm({ ...form, password: text });
    if (text || formErrors.password) {
      validatePassword(text, form.confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setForm({ ...form, confirmPassword: text });
    if ((form.password && text) || formErrors.password) {
      validatePassword(form.password, text);
    }
  };

  const handleEmailChange = (text: string) => {
    setForm({ ...form, email: text });
    if (text || formErrors.email) {
      validateEmail(text);
    }
  };

  const handlePhoneChange = (text: string) => {
    setForm({ ...form, phone: text });
    if (text || formErrors.phone) {
      validatePhone(text);
    }
  };

  const renderIntroSlide = ({ item, index }: { item: IntroSlide; index: number }) => (
    <View style={styles.slide}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.slideImage} 
        resizeMode="cover"
      />
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.slideIcon}>{item.icon}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  useEffect(() => {
    // Only check auth on initial load, not after successful registration
    const checkAuthAndRedirect = async () => {
      // Remove the auto-redirect to tabs after authentication
      // This was causing the unwanted redirect after registration
      
      // Only redirect in very specific cases that we control explicitly
      // through the registration process itself
    };

    checkAuthAndRedirect();
    // Only run on initial auth status
  }, [auth?.session]);

  const handleRegistrationError = (error: string | undefined) => {
    console.log('Handling registration error:', error);
    
    if (error === 'EMAIL_EXISTS') {
      Alert.alert(
        "Account Exists",
        "An account with this email already exists. Would you like to login?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push('/login') }
        ]
      );
    } else {
      setError(error || 'Registration failed. Please try again.');
    }
  };

  if (showIntro) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.introContainer}>
          <FlatList
            ref={flatListRef}
            data={introSlides}
            renderItem={renderIntroSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentSlide(newIndex);
            }}
            keyExtractor={(item) => item.id}
          />
          
          <View style={styles.pagination}>
            {introSlides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleManualSlideChange(index)}
                style={[
                  styles.paginationDot,
                  index === currentSlide && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.accountPrompt}>
            <Text style={styles.accountPromptText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLoginRedirect}>
              <Text style={styles.loginLinkText}>Log in here</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.introButton}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {currentSlide === introSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={currentSlide === introSlides.length - 1 ? 'heart-circle' : 'arrow-forward'}
              size={24}
              color="#ffffff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressFill, { width: `${(step / 7) * 100}%` }]} />
            </View>
            
            <View style={styles.header}>
              {step === 1 && (
                <Text style={styles.title}>Create Your Account</Text>
              )}
              {step === 7 && (
                <Text style={styles.title}>Personalize Your Experience</Text>
              )}
              <Text style={styles.subtitle}>{getStepTitle()}</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === 1 && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={text => setForm({ ...form, fullName: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  autoFocus={!keyboardVisible}
                />
              </View>
            )}

            {step === 2 && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, formErrors.email ? styles.inputError : null]}
                  value={form.email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus={!keyboardVisible}
                />
                {formErrors.email ? (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                ) : null}
              </View>
            )}

            {step === 3 && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, formErrors.password ? styles.inputError : null]}
                  value={form.password}
                  onChangeText={handlePasswordChange}
                  placeholder="Create a password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoFocus={!keyboardVisible}
                />
                <TextInput
                  style={[styles.input, formErrors.password ? styles.inputError : null]}
                  value={form.confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                />
                {formErrors.password ? (
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                ) : null}
              </View>
            )}

            {step === 4 && (
              <View style={styles.inputContainer}>
                <CustomPhoneInput
                  ref={phoneInput}
                  defaultValue={form.phone}
                  defaultCode="US"
                  onChangeFormattedText={handlePhoneChange}
                  containerStyle={styles.phoneContainer}
                  textInputStyle={styles.phoneTextInput}
                  placeholder="(555) 555-5555"
                />
                {formErrors.phone ? (
                  <Text style={styles.errorText}>{formErrors.phone}</Text>
                ) : null}
              </View>
            )}

            {step === 5 && (
              <View style={styles.inputContainer}>
                {Platform.OS === 'web' ? (
                  <View style={styles.webDatePickerContainer}>
                    <Text style={styles.datePickerLabel}>Select your birth date:</Text>
                    <input
                      type="date"
                      value={form.birthDate.toISOString().split('T')[0]}
                      onChange={(e) => setForm({ ...form, birthDate: new Date(e.target.value) })}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #6366f1',
                        width: '100%',
                        fontSize: '16px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.nativeDatePickerContainer}>
                    <Text style={styles.datePickerLabel}>Select your birth date:</Text>
                    <DateTimePicker
                      value={form.birthDate}
                      mode="date"
                      display="spinner"
                      themeVariant="light"
                      textColor="#000000"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setForm({ ...form, birthDate: selectedDate });
                        }
                      }}
                      style={styles.nativeDatePicker}
                    />
                  </View>
                )}
              </View>
            )}

            {step === 6 && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, formErrors.height ? styles.inputError : null]}
                  value={form.height}
                  onChangeText={text => setForm({ ...form, height: text })}
                  placeholder="Enter your height (e.g., 5 feet 10 inches)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="default"
                  autoFocus={!keyboardVisible}
                />
                {formErrors.height ? (
                  <Text style={styles.errorText}>{formErrors.height}</Text>
                ) : null}
              </View>
            )}

            {step === 7 && (
              <View style={styles.readingTypes}>
                {coachingTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeButton, type.selected && styles.typeButtonSelected]}
                    onPress={() => toggleReadingType(type.id)}
                  >
                    <Text
                      style={[styles.typeButtonText, type.selected && styles.typeButtonTextSelected]}
                    >
                      {type.title}
                    </Text>
                    {type.selected && (
                      <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {step === 7 ? 'Get Started' : 'Continue'}
                </Text>
                <Ionicons
                  name={step === 7 ? 'rocket' : 'arrow-forward'}
                  size={24}
                  color="#ffffff"
                  style={styles.buttonIcon}
                />
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
  },
  slideContent: {
    flex: 1,
    padding: Platform.OS === 'ios' ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  slideIcon: {
    fontSize: Platform.OS === 'ios' ? 40 : 36,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideTitle: {
    fontSize: Platform.OS === 'ios' ? 28 : 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 24 : 22,
    paddingHorizontal: 12,
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
