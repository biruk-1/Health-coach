import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const specialties = [
  { id: '1', name: 'Tarot Reading', icon: 'card' },
  { id: '2', name: 'Astrology', icon: 'planet' },
  { id: '3', name: 'Mediumship', icon: 'people' },
  { id: '4', name: 'Crystal Healing', icon: 'prism' },
  { id: '5', name: 'Palm Reading', icon: 'hand-left' },
  { id: '6', name: 'Dream Interpretation', icon: 'moon' },
  { id: '7', name: 'Energy Healing', icon: 'flash' },
  { id: '8', name: 'Numerology', icon: 'calculator' },
  { id: '9', name: 'Chakra Balancing', icon: 'flower' },
  { id: '10', name: 'Angel Reading', icon: 'sunny' },
];

export default function SpecialtiesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSpecialty = (id: string) => {
    setSelected(prev => 
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selected.length > 0) {
      router.push('/psychic-onboarding/background');
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
        <Text style={styles.title}>Your Specialties</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Select your areas of expertise. Choose all that apply to showcase your unique abilities.
        </Text>

        <View style={styles.specialtiesGrid}>
          {specialties.map(specialty => (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.specialtyItem,
                selected.includes(specialty.id) && styles.specialtyItemSelected
              ]}
              onPress={() => toggleSpecialty(specialty.id)}
            >
              <Ionicons
                name={specialty.icon as any}
                size={32}
                color={selected.includes(specialty.id) ? '#ffffff' : '#6366f1'}
              />
              <Text
                style={[
                  styles.specialtyText,
                  selected.includes(specialty.id) && styles.specialtyTextSelected
                ]}
              >
                {specialty.name}
              </Text>
              {selected.includes(specialty.id) && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selected.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected.length === 0}
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
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  specialtyItem: {
    width: '47%',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
    position: 'relative',
  },
  specialtyItemSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  specialtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  specialtyTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
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