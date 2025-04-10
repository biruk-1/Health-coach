import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleUserSelect = () => {
    router.push('/user-onboarding');
  };

  const handleCoachSelect = () => {
    router.push('/coach-onboarding');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#5E72E4', '#7F90FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Path</Text>
      </LinearGradient>
      
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 20, 40) }]}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Select your role to begin your health journey</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.option} 
            onPress={handleUserSelect}
            activeOpacity={0.9}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="person" size={36} color="#5E72E4" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>I'm looking for a coach</Text>
              <Text style={styles.optionDescription}>
                Get matched with expert health coaches or use AI coaching
              </Text>
            </View>
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={24} color="#5E72E4" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option} 
            onPress={handleCoachSelect}
            activeOpacity={0.9}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="fitness" size={36} color="#5E72E4" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>I'm a health coach</Text>
              <Text style={styles.optionDescription}>
                Create your profile and start helping others achieve their health goals
              </Text>
            </View>
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={24} color="#5E72E4" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 120 : 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  arrow: {
    marginLeft: 12,
  },
}); 