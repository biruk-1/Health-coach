import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getHealthCoachById, HealthCoach } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';

export default function CoachDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { balance, refreshBalance } = usePurchases();
  const [coach, setCoach] = useState<HealthCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const CREDITS_PER_MESSAGE = 2; // Cost per message

  useEffect(() => {
    // If no user is authenticated, this check is moved to the _layout.tsx navigation guard
    // This prevents the component from redirecting itself
    
    async function loadCoachDetails() {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading coach details for ID:', id);
        
        if (!id) {
          throw new Error('No coach ID provided');
        }

        const coachData = await getHealthCoachById(id);
        
        if (!coachData) {
          throw new Error('Coach not found');
        }
        
        console.log('Coach data loaded:', coachData.name);
        setCoach(coachData);
      } catch (err) {
        console.error('Error loading coach:', err);
        setError(err.message || 'Failed to load coach details');
      } finally {
        setLoading(false);
      }
    }

    loadCoachDetails();
    refreshBalance(); // Load the user's current credit balance
  }, [id]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      return;
    }

    // Check if user has enough credits
    if (balance < CREDITS_PER_MESSAGE) {
      Alert.alert(
        "Insufficient Credits",
        `You need ${CREDITS_PER_MESSAGE} credits to send a message. Would you like to purchase more?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Add Credits", 
            onPress: () => {
              // Navigate to purchase screen
              router.push({
                pathname: '/PurchaseScreen',
                params: {
                  screenTitle: 'Purchase Credits',
                  iconName: 'wallet',
                  onCloseRoute: `/[id]?id=${id}`,
                  successRoute: `/[id]?id=${id}`,
                  successMessage: 'You have successfully purchased'
                }
              });
            } 
          }
        ]
      );
      return;
    }

    setIsSending(true);
    
    // Simulate sending message
    setTimeout(() => {
      // Would normally deduct credits through an API call
      Alert.alert("Message Sent", `Your message has been sent to ${coach?.name}. ${CREDITS_PER_MESSAGE} credits have been deducted from your balance.`);
      setMessage('');
      setIsSending(false);
      refreshBalance(); // Refresh balance after sending
    }, 1000);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading coach details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#94a3b8" />
        <Text style={styles.errorText}>Coach not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: coach.name,
        headerShown: true,
        headerTintColor: '#ffffff',
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerShadowVisible: false
      }} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.header}>
          <Image 
            source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.profileImage} 
          />
          <View style={styles.headerContent}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{coach.name}</Text>
              {coach.is_verified && (
                <Ionicons name="checkmark-circle" size={24} color="#6366f1" style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={styles.specialty}>{coach.specialty}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.rating}>{(Number(coach.rating) || 5.0).toFixed(1)}</Text>
              <Text style={styles.reviews}>({coach.reviews_count || 0} reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>
            {coach.bio || `${coach.name} is a professional health coach specializing in ${coach.specialty.toLowerCase()}. They are dedicated to helping clients achieve their health and wellness goals through personalized guidance and support.`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.tagsContainer}>
            {coach.tags?.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            )) || 
            ['Health', 'Wellness', coach.specialty].map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>Send a Message</Text>
          <Text style={styles.creditsInfo}>
            Balance: {balance} credits • Cost per message: {CREDITS_PER_MESSAGE} credits
          </Text>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              multiline
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!message.trim() || isSending) && styles.disabledButton]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => Alert.alert('Book Session', `Book a session with ${coach.name}`)}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.bookButtonText}>Book a Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  specialty: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tagText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  messageSection: {
    marginBottom: 24,
  },
  creditsInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    maxHeight: 150,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  bookButton: {
    marginTop: 8,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});