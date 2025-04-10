import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Theme = 'system' | 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

export default function AppearanceScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

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
        <Text style={styles.title}>Appearance</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <TouchableOpacity
          style={[styles.option, theme === 'system' && styles.optionSelected]}
          onPress={() => setTheme('system')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="settings" size={24} color={theme === 'system' ? '#6366f1' : '#ffffff'} />
            <Text style={[styles.optionText, theme === 'system' && styles.optionTextSelected]}>
              System Default
            </Text>
          </View>
          {theme === 'system' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, theme === 'light' && styles.optionSelected]}
          onPress={() => setTheme('light')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="sunny" size={24} color={theme === 'light' ? '#6366f1' : '#ffffff'} />
            <Text style={[styles.optionText, theme === 'light' && styles.optionTextSelected]}>
              Light
            </Text>
          </View>
          {theme === 'light' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, theme === 'dark' && styles.optionSelected]}
          onPress={() => setTheme('dark')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="moon" size={24} color={theme === 'dark' ? '#6366f1' : '#ffffff'} />
            <Text style={[styles.optionText, theme === 'dark' && styles.optionTextSelected]}>
              Dark
            </Text>
          </View>
          {theme === 'dark' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Size</Text>
        <TouchableOpacity
          style={[styles.option, fontSize === 'small' && styles.optionSelected]}
          onPress={() => setFontSize('small')}
        >
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, fontSize === 'small' && styles.optionTextSelected]}>
              Small
            </Text>
          </View>
          {fontSize === 'small' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, fontSize === 'medium' && styles.optionSelected]}
          onPress={() => setFontSize('medium')}
        >
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, fontSize === 'medium' && styles.optionTextSelected]}>
              Medium
            </Text>
          </View>
          {fontSize === 'medium' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, fontSize === 'large' && styles.optionSelected]}
          onPress={() => setFontSize('large')}
        >
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, fontSize === 'large' && styles.optionTextSelected]}>
              Large
            </Text>
          </View>
          {fontSize === 'large' && <Ionicons name="checkmark" size={24} color="#6366f1" />}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  section: {
    backgroundColor: '#111111',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  optionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});