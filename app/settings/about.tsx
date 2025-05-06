import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  const handleRateApp = async () => {
    try {
      // Replace these URLs with your actual App Store and Play Store URLs
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/YOUR_APP_ID', // Replace YOUR_APP_ID with actual App Store ID
        android: 'market://details?id=com.biruk123.healthCoach', // Using the package name from app.json
        default: 'https://healthcoach.com', // Fallback URL for web
      });

      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback URLs if the app store links don't work
        const fallbackUrl = Platform.select({
          ios: 'https://apps.apple.com/app/YOUR_APP_ID',
          android: 'https://play.google.com/store/apps/details?id=com.biruk123.healthCoach',
          default: 'https://healthcoach.com',
        });
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Error opening store URL:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>About</Text>
        <Text style={styles.subtitle}>Learn more about our health coaching platform</Text>
      </View>

      <View style={styles.logoSection}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=200&h=200&fit=crop' }}
          style={styles.logo}
        />
        <Text style={styles.appName}>Health Coach</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.description}>
          Health Coach connects you with expert health professionals and wellness coaches. 
          Our platform provides personalized health plans, nutrition guidance, and real-time coaching 
          to help you achieve your wellness goals and live a healthier life.
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={handleRateApp}
        >
          <Text style={styles.linkText}>Rate the App</Text>
          <Ionicons name="star" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.credits}>
          Made with ❤️ by the Health Coach team
        </Text>
        <Text style={styles.copyright}>
          © 2023 Health Coach. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    marginLeft:'35%'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginLeft:'10%',
    fontWeight: '500',
  },
  logoSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  credits: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});