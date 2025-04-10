import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Linking,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewRequestScreen() {
  const router = useRouter();

  // Prevent going back
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const handleReview = async () => {
    try {
      // For demo purposes, we'll use Instagram's App Store link
      // In a real app, this would be your app's store link
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/instagram/id389801252',
        android: 'market://details?id=com.instagram.android',
        default: 'https://instagram.com'
      });

      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
      console.error('Error opening store:', error);
    }

    // Navigate to profile photo upload screen
    router.replace('/psychic-onboarding/profile-photo');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=800&auto=format&fit=crop' }}
            style={styles.image}
          />
          <View style={styles.overlay} />
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name="star" 
                size={32} 
                color="#fbbf24" 
                style={styles.star}
              />
            ))}
          </View>
        </View>

        <Text style={styles.title}>Love Our App?</Text>
        <Text style={styles.subtitle}>
          Your review helps other psychics discover our platform and grow their practice. Share your verification experience!
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="people" size={24} color="#6366f1" />
            <Text style={styles.benefitText}>Help others discover trusted psychics</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
            <Text style={styles.benefitText}>Support authentic spiritual guidance</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="heart" size={24} color="#6366f1" />
            <Text style={styles.benefitText}>Build a stronger spiritual community</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={handleReview}
        >
          <Text style={styles.reviewButtonText}>
            {Platform.select({
              ios: 'Rate on App Store',
              android: 'Rate on Play Store',
              default: 'Rate Us'
            })}
          </Text>
          <Ionicons name="star" size={24} color="#ffffff" style={styles.buttonIcon} />
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
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  imageContainer: {
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
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  starContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  star: {
    margin: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitText: {
    color: '#1e293b',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  reviewButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});