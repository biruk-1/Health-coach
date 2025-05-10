import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getHealthCoachById, HealthCoach } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAppNavigation } from '../lib/navigation';

export default function CoachDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { balance, refreshBalance } = usePurchases();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [coach, setCoach] = useState<HealthCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const CREDITS_PER_MESSAGE = 2; // Cost per message
  const navigation = useAppNavigation();

  // Check if coach is in favorites
  useEffect(() => {
    if (coach) {
      const isFav = isFavorite(coach.id);
      console.log(`Coach ${coach.id} favorite status:`, isFav);
      setFavorited(isFav);
    }
  }, [coach, isFavorite]);

  // Optimized coach data loading with caching and retry logic
  const loadCoachDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading coach details for ID:', id);
      
      if (!id) {
        throw new Error('No coach ID provided');
      }

      // Make sure we have a clean string ID
      const coachIdString = id.toString().trim();
      console.log('Fetching coach with cleaned ID:', coachIdString);
      
      // Try to fetch the coach with 2 attempts, with better timeout handling
      let coachData = null;
      let attempts = 0;
      
      while (!coachData && attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to fetch coach with ID: ${coachIdString}`);
        
        try {
          // Set a timeout promise to avoid long hanging requests
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 3000);
          });
          
          // Race between the actual fetch and the timeout
          coachData = await Promise.race([
            getHealthCoachById(coachIdString),
            timeoutPromise
          ]);
          
          if (coachData) break;
        } catch (fetchError) {
          console.log(`Attempt ${attempts} failed:`, fetchError);
          
          if (attempts < 3) {
            // Exponential backoff
            const delay = 300 * Math.pow(2, attempts - 1);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!coachData) {
        console.error('Coach not found after multiple attempts for ID:', coachIdString);
        throw new Error('Coach not found. The coach may have been removed or is temporarily unavailable.');
      }
      
      console.log('Coach data loaded successfully:', coachData.name);
      setCoach(coachData);
    } catch (err) {
      console.error('Error loading coach:', err);
      const errorMessage = err.message || 'Failed to load coach details';
      setError(errorMessage);
      
      // Log more details about the error for debugging
      if (err.response) {
        console.error('API Error Response:', err.response);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCoachDetails();
    refreshBalance();
  }, [loadCoachDetails, refreshBalance]);

  const handleToggleFavorite = async () => {
    if (!coach) return;

    try {
      // Disable interaction during favorite operation
      setLoading(true);
      
      if (favorited) {
        console.log(`Removing coach from favorites: ${coach.name} (${coach.id})`);
        await removeFavorite(coach.id);
        setFavorited(false);
        Alert.alert("Removed", `${coach.name} has been removed from your favorites`);
      } else {
        console.log(`Adding coach to favorites: ${coach.name} (${coach.id})`);
        await addFavorite(coach);
        setFavorited(true);
        Alert.alert("Added", `${coach.name} has been added to your favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      Alert.alert("Error", "There was a problem updating your favorites. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
              // Use the safe navigation utility
              navigation.navigateToAddFunds(id.toString());
            } 
          }
        ]
      );
      return;
    }

    setIsSending(true);
    
    // Simulate sending message
    setTimeout(() => {
      Alert.alert("Message Sent", `Your message has been sent to ${coach?.name}. ${CREDITS_PER_MESSAGE} credits have been deducted from your balance.`);
      setMessage('');
      setIsSending(false);
      refreshBalance();
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
      >
        {/* Hero Image and Gradient Overlay */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.heroImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          >
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
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButtonContainer}
          onPress={handleToggleFavorite}
        >
          <LinearGradient
            colors={favorited ? ['#ef4444', '#dc2626'] : ['#6366f1', '#4f46e5']}
            style={styles.favoriteButton}
          >
            <Ionicons 
              name={favorited ? "heart" : "heart-outline"} 
              size={24} 
              color="#ffffff" 
            />
            <Text style={styles.favoriteButtonText}>
              {favorited ? 'Remove from Favorites' : 'Add to Favorites'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Coach Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>
            {coach.bio || `${coach.name} is a professional health coach specializing in ${coach.specialty?.toLowerCase() || 'health and wellness'}. They are dedicated to helping clients achieve their health and wellness goals through personalized guidance and support.`}
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
            ['Health', 'Wellness', coach.specialty].filter(Boolean).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
            </View>
            ))}
            </View>
            </View>

        {/* Additional Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={24} color="#6366f1" />
            <Text style={styles.infoCardTitle}>Location</Text>
            <Text style={styles.infoCardText}>{coach.location || 'Remote'}</Text>
            </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#6366f1" />
            <Text style={styles.infoCardTitle}>Experience</Text>
            <Text style={styles.infoCardText}>{coach.years_experience || '5'} years</Text>
            </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.infoCardTitle}>Status</Text>
            <View style={[styles.statusBadge, coach.is_online ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.statusText}>{coach.is_online ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        {/* Message Section */}
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
  infoCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
  },
  infoCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoCardTitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  onlineBadge: {
    backgroundColor: '#dcfce7',
  },
  offlineBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  messageSection: {
    marginHorizontal: 16,
    marginTop: 24,
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