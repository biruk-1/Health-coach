import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Alert, TextInput, InteractionManager } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getHealthCoachById, HealthCoach } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAppNavigation, navigate, navigateToAddFunds } from '../lib/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoachDetailScreen() {
  const { navigateToAddFunds } = useAppNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { balance, refreshBalance, setBalance } = usePurchases();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [coach, setCoach] = useState<HealthCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const CREDITS_PER_MESSAGE = 1;
  
  // Safety check for invalid ID parameter
  useEffect(() => {
    if (!id) {
      console.error('ID parameter is missing or invalid');
      setError('Invalid coach ID. Please try again.');
      setLoading(false);
    }
  }, [id]);

  // Set up safe navigation
  useEffect(() => {
    const setupNavigation = async () => {
      try {
        // Clear any specific navigation flags related to this screen
        await AsyncStorage.removeItem('is_navigating');
        await AsyncStorage.removeItem('navigation_started_at');
        
        console.log('CoachDetailScreen: Ready for safe navigation');
      } catch (error) {
        console.error('CoachDetailScreen: Error setting up navigation:', error);
      }
    };
    
    setupNavigation();
    
    // Clean up on unmount - to be safe, clear any navigation locks
    return () => {
      console.log('CoachDetailScreen unmounting, clearing navigation locks');
      AsyncStorage.removeItem('is_navigating')
        .catch(error => console.error('CoachDetailScreen: Failed to clear locks:', error));
    };
  }, []);

  useEffect(() => {
    if (coach) {
      const isFav = isFavorite(coach.id);
      console.log(`Coach ${coach.id} favorite status:`, isFav);
      setFavorited(isFav);
    }
  }, [coach, isFavorite]);

  const loadCoachDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading coach details for ID:', id);

      if (!id) throw new Error('No coach ID provided');

      const coachIdString = id.toString().trim();
      console.log('Fetching coach with cleaned ID:', coachIdString);

      let coachData = null;
      let attempts = 0;

      while (!coachData && attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to fetch coach with ID: ${coachIdString}`);

        try {
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 3000);
          });

          coachData = await Promise.race([getHealthCoachById(coachIdString), timeoutPromise]);

          if (coachData) break;
        } catch (fetchError) {
          console.log(`Attempt ${attempts} failed:`, fetchError);

          if (attempts < 3) {
            const delay = 300 * Math.pow(2, attempts - 1);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (!coachData) {
        console.error('Coach not found after multiple attempts for ID:', coachIdString);
        throw new Error('Coach not found. The coach may have been removed or is temporarily unavailable.');
      }

      console.log('Coach data loaded successfully:', coachData.name);
      setCoach(coachData);
    } catch (error) {
      console.error('Error loading coach:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load coach details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCoachDetails();
    refreshBalance();
  }, [loadCoachDetails, refreshBalance]);

  const handleBackPress = useCallback(async () => {
    await navigate('/(tabs)', { replace: true });
  }, []);

  const handleAddFunds = useCallback(async () => {
    await navigateToAddFunds();
  }, [navigateToAddFunds]);

  const handleToggleFavorite = async () => {
    if (!coach) return;

    try {
      setLoading(true);

      if (favorited) {
        console.log(`Removing coach from favorites: ${coach.name} (${coach.id})`);
        await removeFavorite(coach.id);
        setFavorited(false);
        Alert.alert('Removed', `${coach.name} has been removed from your favorites`);
      } else {
        console.log(`Adding coach to favorites: ${coach.name} (${coach.id})`);
        await addFavorite(coach);
        setFavorited(true);
        Alert.alert('Added', `${coach.name} has been added to your favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      Alert.alert('Error', 'There was a problem updating your favorites. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (balance < CREDITS_PER_MESSAGE) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${CREDITS_PER_MESSAGE} credits to send a message. Would you like to purchase more?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Credits', onPress: handleAddFunds },
        ]
      );
      return;
    }

    setIsSending(true);

    // Deduct credits before sending message
    const newBalance = balance - CREDITS_PER_MESSAGE;
    AsyncStorage.setItem('credits_balance', newBalance.toString())
      .then(() => {
        setBalance(newBalance);
        
        setTimeout(() => {
          Alert.alert('Message Sent', `Your message has been sent to ${coach?.name}. ${CREDITS_PER_MESSAGE} credits have been deducted from your balance.`);
          setMessage('');
          setIsSending(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Error updating credit balance:', err);
        setIsSending(false);
        Alert.alert('Error', 'There was a problem processing your credits. Please try again.');
      });
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
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: coach.name,
          headerShown: true,
          headerTintColor: '#ffffff',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={{ marginLeft: 8, padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} ref={scrollViewRef}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }}
            style={styles.heroImage}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.heroGradient}>
            <View style={styles.profileContainer}>
              <Image
                source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }}
                style={styles.profileImage}
              />
              <View style={styles.nameContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{coach.name}</Text>
                  {coach.is_verified && (
                    <Ionicons name="checkmark-circle" size={24} color="#6366f1" style={styles.verifiedIcon} />
                  )}
                </View>
                <Text style={styles.specialty}>{coach.specialty}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.rating}>
                    {typeof coach.rating === 'number'
                      ? coach.rating.toFixed(1)
                      : typeof coach.rating === 'string'
                      ? parseFloat(coach.rating).toFixed(1)
                      : '5.0'}
                  </Text>
                  <Text style={styles.reviews}>({coach.reviews_count || 0} reviews)</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity style={styles.favoriteButtonContainer} onPress={handleToggleFavorite}>
          <LinearGradient
            colors={favorited ? ['#ef4444', '#dc2626'] : ['#6366f1', '#4f46e5']}
            style={styles.favoriteButton}
          >
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={24} color="#ffffff" />
            <Text style={styles.favoriteButtonText}>{favorited ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>
            {coach.bio || `${coach.name} is a professional health coach specializing in ${coach.specialty?.toLowerCase() || 'health and wellness'}. They are dedicated to helping clients achieve their health and wellness goals through personalized guidance and support.`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.tagsContainer}>
            {coach.specialty
              ? ['Health', 'Wellness', coach.specialty].filter(Boolean).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))
              : ['Health', 'Wellness'].map((tag, index) => (
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
    paddingBottom: 40,
  },
  heroContainer: {
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  specialty: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reviews: {
    fontSize: 14,
    color: '#e5e7eb',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteButtonContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  favoriteButton: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  favoriteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
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
  messageSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  creditsInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  }
});