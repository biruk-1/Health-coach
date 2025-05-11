import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { navigateToCosmicAI } from '../../lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function AskCoachAITab() {
  // Trigger navigation to the Cosmic AI Chat screen after a short delay
  const hasNavigated = useRef(false);
  
  useEffect(() => {
    if (hasNavigated.current) return;
    
    const timer = setTimeout(() => {
      hasNavigated.current = true;
      navigateToCosmicAI();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="fitness" size={64} color="#ffffff" style={styles.icon} />
          <Text style={styles.title}>Ask Coach AI</Text>
          <Text style={styles.subtitle}>Redirecting to AI health coach...</Text>
          <View style={styles.loader}>
            <View style={styles.loaderDot} />
            <View style={styles.loaderDot} />
            <View style={styles.loaderDot} />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    margin: 4,
    opacity: 0.7,
  },
}); 