import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function VerifySuccessScreen() {
  const router = useRouter();

  // Prevent going back
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const handleStartJourney = () => {
    // Use replace to prevent going back to this screen
    router.replace('/review-request');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1513757271804-385fb022e70f?w=800&auto=format&fit=crop' }}
            style={styles.backgroundImage}
          />
          <View style={styles.overlay} />
          <View style={styles.celebrationIcon}>
            <Text style={styles.emoji}>🎉</Text>
          </View>
        </View>

        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>You're now verified and can start helping others while earning big!</Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={32} color="#10b981" />
            <Text style={styles.benefitTitle}>Verified Status</Text>
            <Text style={styles.benefitText}>Stand out with a verified badge on your profile</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="trending-up" size={32} color="#6366f1" />
            <Text style={styles.benefitTitle}>Priority Listing</Text>
            <Text style={styles.benefitText}>Get featured at the top of search results</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="wallet" size={32} color="#f59e0b" />
            <Text style={styles.benefitTitle}>Higher Earnings</Text>
            <Text style={styles.benefitText}>Earn more with premium rates and bonuses</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartJourney}
        >
          <Text style={styles.buttonText}>Start Your Journey</Text>
          <Ionicons name="rocket" size={24} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  celebrationIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  benefitsContainer: {
    width: '100%',
    gap: 24,
  },
  benefitItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  button: {
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
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});