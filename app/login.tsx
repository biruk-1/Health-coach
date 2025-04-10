import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Add keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFormErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setFormErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 6) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const handleEmailChange = (text: string) => {
    setForm(prev => ({ ...prev, email: text }));
    if (text || formErrors.email) {
      validateEmail(text);
    }
  };

  const handlePasswordChange = (text: string) => {
    setForm(prev => ({ ...prev, password: text }));
    if (text || formErrors.password) {
      validatePassword(text);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    
    if (!form.email || !form.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await login(form.email, form.password);
      
      if (result.success) {
        console.log('Login successful, redirecting to tabs');
        router.replace('/(tabs)'); // Use replace to prevent back navigation
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return;
    router.back();
  };

  const handleSignupRedirect = () => {
    if (!loading) {
      router.push('/onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, formErrors.email ? styles.inputError : null]}
                value={form.email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus={!keyboardVisible}
              />
              {formErrors.email ? (
                <Text style={styles.fieldErrorText}>{formErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, formErrors.password ? styles.inputError : null]}
                value={form.password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="password"
              />
              {formErrors.password ? (
                <Text style={styles.fieldErrorText}>{formErrors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={24} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={handleSignupRedirect}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  form: {
    padding: 20,
    gap: 20,
    backgroundColor: '#ffffff',
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    color: '#1a1a1a',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 56,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  registerLinkText: {
    color: '#6366f1',
    fontSize: 16,
  },
});