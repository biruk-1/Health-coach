import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';

export default function ContactScreen() {
  const router = useRouter();
  const supportEmail = 'hello@psychicnear.me';

  const handleEmailSupport = async () => {
    const subject = 'Support Request';
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        try {
          await Clipboard.setStringAsync(supportEmail);
          Alert.alert(
            'Email Copied',
            'Support email address has been copied to your clipboard.'
          );
        } catch (clipboardError) {
          // Fallback if clipboard fails
          Alert.alert(
            'Contact Email',
            `Please contact us at: ${supportEmail}`
          );
        }
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        'Contact Email',
        `Please contact us at: ${supportEmail}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Contact Support',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How can we help?</Text>
            <Text style={styles.description}>
              Choose your preferred method to contact our support team.
            </Text>
          </View>

          <TouchableOpacity style={styles.contactOption} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={24} color="#6366f1" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Email Support</Text>
              <Text style={styles.optionDescription}>Send us an email at {supportEmail}</Text>
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  backButton: {
    padding: 10,
  },
}); 