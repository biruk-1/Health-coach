import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function BackgroundScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    experience: '',
    certifications: '',
    approach: '',
  });

  const isValid = () => {
    return (
      form.experience.trim().length > 0 &&
      form.certifications.trim().length > 0 &&
      form.approach.trim().length > 0
    );
  };

  const handleNext = () => {
    if (isValid()) {
      router.push('/psychic-onboarding/languages');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Professional Background</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Share your experience and qualifications to help clients understand your expertise.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={form.experience}
              onChangeText={(text) => setForm(prev => ({ ...prev, experience: text }))}
              placeholder="e.g., 10+ years of professional readings"
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certifications & Training</Text>
            <TextInput
              style={styles.input}
              value={form.certifications}
              onChangeText={(text) => setForm(prev => ({ ...prev, certifications: text }))}
              placeholder="List your relevant certifications and training"
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Approach</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.approach}
              onChangeText={(text) => setForm(prev => ({ ...prev, approach: text }))}
              placeholder="Describe your reading style and approach"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isValid() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isValid()}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={24} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
    margin: 20,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  textArea: {
    minHeight: 120,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
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