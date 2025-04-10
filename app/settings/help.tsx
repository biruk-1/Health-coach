import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const handleBack = () => {
    console.log('Navigating back to settings');
    router.back();
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@fitnesscoachpro.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
    

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqCard}>
            <TouchableOpacity style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>How do I get started with my fitness journey?</Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </View>
              <Text style={styles.faqAnswer}>
                Create your profile, set your fitness goals, and connect with a personal trainer. Our AI-powered platform will help create a personalized workout and nutrition plan tailored to your needs.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>How do training sessions work?</Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </View>
              <Text style={styles.faqAnswer}>
                Training sessions can be conducted in-person or virtually. Each session is customized to your fitness level and goals. You can schedule sessions, track progress, and receive real-time feedback from your coach.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>What kind of support do I get?</Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </View>
              <Text style={styles.faqAnswer}>
                You get 24/7 access to your personal trainer, nutrition guidance, workout tracking, progress monitoring, and community support. Our platform also provides educational resources and tips for maintaining a healthy lifestyle.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <TouchableOpacity style={styles.supportCard} onPress={handleContactSupport}>
            <View style={styles.supportInfo}>
              <Ionicons name="mail" size={24} color="#6366f1" />
              <Text style={styles.supportText}>Email Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.legalCard}>
            <View style={styles.legalInfo}>
              <Ionicons name="document-text" size={24} color="#6366f1" />
              <Text style={styles.legalText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalCard}>
            <View style={styles.legalInfo}>
              <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
              <Text style={styles.legalText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    marginLeft:'15%',
  },
  faqCard: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 20,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});
