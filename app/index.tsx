import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/onboarding');
  };

  const handleVerifyAsCoach = () => {
    router.push('/verify-psychic');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Ionicons name="fitness-outline" size={64} color="#6366f1" />
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
            <Ionicons name="nutrition-outline" size={24} color="#6366f1" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized Health Plans</Text>
              <Text style={styles.featureText}>
                Get tailored nutrition and wellness programs designed for your unique health goals
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="pulse" size={24} color="#6366f1" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Track Your Health Progress</Text>
              <Text style={styles.featureText}>
                Monitor your wellness achievements with detailed health metrics tracking
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="medkit-outline" size={24} color="#6366f1" />
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
          <Ionicons name="heart-circle-outline" size={16} color="#6366f1" style={styles.verifyIcon} />
          <Text style={styles.verifyText}>Become a Health Coach</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 16,
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 36 : 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: Platform.OS === 'ios' ? 28 : 24,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 40,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    height: Platform.OS === 'ios' ? 56 : 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loginButtonText: {
    color: '#1e293b',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    height: Platform.OS === 'ios' ? 56 : 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  featuresSection: {
    gap: 16,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureText: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: '#64748b',
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
  },
  verifyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'ios' ? 16 : 14,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyIcon: {
    marginRight: 8,
  },
  verifyText: {
    color: '#6366f1',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    fontWeight: '600',
  },
}); 