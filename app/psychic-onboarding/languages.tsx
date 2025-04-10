import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const languages = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { id: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'ko', name: 'Korean', flag: '🇰🇷' },
  { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export default function LanguagesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(['en']); // English by default
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (id: string) => {
    setSelected(prev => 
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Update psychic profile with languages
      await api.psychics.updateProfile({
        languages: selected
      });

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert(
        'Error',
        'Failed to complete profile. Please try again.'
      );
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Languages</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Select all languages you can provide readings in. This helps match you with clients who speak these languages.
        </Text>

        <View style={styles.languagesList}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageItem,
                selected.includes(language.id) && styles.languageItemSelected
              ]}
              onPress={() => toggleLanguage(language.id)}
            >
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <Text
                style={[
                  styles.languageText,
                  selected.includes(language.id) && styles.languageTextSelected
                ]}
              >
                {language.name}
              </Text>
              {selected.includes(language.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Complete Profile</Text>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" style={styles.buttonIcon} />
            </>
          )}
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
  languagesList: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  languageItemSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  languageTextSelected: {
    fontWeight: '600',
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