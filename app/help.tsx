// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'How do readings work?',
    answer: 'Our psychics connect with you through our platform to provide personalized readings. You can choose your preferred psychic and communication method.',
  },
  {
    question: 'How do I pay for readings?',
    answer: 'You can add funds to your account using various payment methods. The cost will be deducted from your balance when you request a reading.',
  },
  {
    question: "What if I'm not satisfied?",
    answer: "We offer a satisfaction guarantee. If you're not happy with your reading, please contact our support team within 24 hours.",
  },
  {
    question: 'How do I become a verified psychic?',
    answer: 'To become a verified psychic, you need to go through our verification process, which includes a background check and demonstration of your abilities.',
  },
];

export default function HelpScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    const email = 'hello@psychicnear.me';
    const subject = 'Support Request';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Support Email',
        'Please send an email to: hello@psychicnear.me',
        [{ text: 'OK' }]
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.closeButtonCircle}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={handleContactSupport}
        >
          <Ionicons name="mail-outline" size={24} color="#ffffff" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View 
            key={index}
            style={[
              styles.faqItem,
              index !== faqs.length - 1 && styles.faqItemBorder
            ]}
          >
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={() => router.navigate('/legal/terms')}
        >
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={() => router.navigate('/legal/privacy')}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={() => router.navigate('/legal/guidelines')}
        >
          <Text style={styles.linkText}>Community Guidelines</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    padding: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    padding: 10,
  },
  supportButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  faqItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answer: {
    fontSize: 14,
  },
  linkItem: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 16,
  },
}); 
