// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isOnboarded } = useOnboarding();
  
  // Check auth status on mount and redirect authenticated users
  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Add a small delay to ensure auth is initialized properly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(false);
      
      // If user is authenticated, always redirect to tabs
      if (user) {
        console.log('User is authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      }
      // Unauthenticated users stay on the welcome screen
    };
    
    checkAuthAndNavigate();
  }, [user, router]);

  // Show loading screen if auth is not ready
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#5e35b1', '#3949ab', '#1e88e5']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const handleLogin = () => {
    router.navigate('/login');
  };

  const handleSignUp = () => {
    router.navigate('/onboarding');
  };

  const handleVerifyAsCoach = () => {
    router.navigate('/verify-psychic');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#5e35b1', '#3949ab', '#1e88e5']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="fitness-outline" size={72} color="#ffffff" />
            </View>
            <Text style={styles.title}>Welcome to Health Coach</Text>
            <Text style={styles.subtitle}>
              Your personal health coaching platform, ready to help you achieve your wellness goals
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.signUpButtonText}>Sign Up</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="nutrition-outline" size={28} color="#6366f1" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Personalized Health Plans</Text>
                <Text style={styles.featureText}>
                  Get tailored nutrition and wellness programs designed for your unique health goals
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="pulse" size={28} color="#6366f1" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Track Your Health Progress</Text>
                <Text style={styles.featureText}>
                  Monitor your wellness achievements with detailed health metrics tracking
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="medkit-outline" size={28} color="#6366f1" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Expert Health Coaches</Text>
                <Text style={styles.featureText}>
                  Connect with certified health professionals for personalized guidance
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.verifyLink}
            onPress={handleVerifyAsCoach}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)']}
              style={styles.verifyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="heart-circle-outline" size={18} color="#ffffff" style={styles.verifyIcon} />
              <Text style={styles.verifyText}>Become a Health Coach</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 16,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 36 : 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: Platform.OS === 'ios' ? 28 : 24,
    maxWidth: '90%',
  },
  buttonContainer: {
    gap: 16,
    marginTop: 40,
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 8,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    height: Platform.OS === 'ios' ? 58 : 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    height: Platform.OS === 'ios' ? 58 : 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  featuresSection: {
    gap: 16,
    marginBottom: 40,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: Platform.OS === 'ios' ? 20 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  featureText: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: '#64748b',
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
  },
  verifyLink: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'ios' ? 16 : 14,
    borderRadius: 16,
  },
  verifyIcon: {
    marginRight: 8,
  },
  verifyText: {
    color: '#ffffff',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: '600',
  },
}); 
