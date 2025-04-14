import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { usePurchases } from '../context/PurchaseContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoachById, HealthCoach } from '../services/database';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'health_coach';
  timestamp: Date;
};

const { width } = Dimensions.get('window');

const getRandomPastelColor = (name: string) => {
  if (!name) return 'hsl(0, 70%, 80%)';
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

// Optimize cache management with a longer timeout for frequently accessed coaches
const CACHE_TIMEOUT = 30 * 60 * 1000; // Increase to 30 minutes
type CachedData = {
  data: HealthCoach;
  timestamp: number;
};

const coachCache = new Map<string, CachedData>();

const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_TIMEOUT;
};

const getCachedCoach = (id: string): HealthCoach | null => {
  const cached = coachCache.get(id);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
};

const setCachedCoach = (id: string, data: HealthCoach) => {
  coachCache.set(id, {
    data,
    timestamp: Date.now(),
  });
};

export default function HealthCoachProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [coach, setCoach] = useState<HealthCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { balance, setBalance, loading: purchaseLoading, refreshBalance } = usePurchases();
  const [conversation, setConversation] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const loadCoachData = async () => {
    if (!id) {
      setError('Invalid coach ID');
      setLoading(false);
      return;
    }

    try {
      // Show loading skeleton immediately
      setLoading(true);

      // Check cache first - prioritize cache for instant loading
      const cachedCoach = getCachedCoach(id as string);
      if (cachedCoach) {
        console.log('Using cached coach data for immediate display');
        // Use cached data immediately for instant rendering
        setCoach(cachedCoach);
        setLoading(false);
        
        // Check favorite status in background
        try {
          const isFav = await isFavorite(id as string);
          setFavorited(isFav);
        } catch (err) {
          console.error('Failed to check favorite status:', err);
        }
      }
      
      // Always try to load from Digital Ocean, even if we have cache
      try {
        console.log('Fetching coach with ID from Digital Ocean:', id);
        const coachData = await getCoachById(id as string);
        
        if (coachData) {
          console.log('Successfully loaded coach data from Digital Ocean');
          // Cache the data
          setCachedCoach(id as string, coachData);
          setCoach(coachData);
          
          // Check favorite status
          const isFav = await isFavorite(id as string);
          setFavorited(isFav);
        } else {
          throw new Error('Could not find the health coach profile');
        }
      } catch (digitalOceanError) {
        console.error('Failed to load coach data from Digital Ocean:', digitalOceanError);
        
        // If we didn't already set coach data from cache and Digital Ocean failed
        if (!cachedCoach) {
          throw new Error('Could not load coach data. Please check your connection and try again.');
        } else {
          console.log('⚠️ Falling back to cached data for coach');
        }
      }

    } catch (err: any) {
      console.error('Failed to load coach data:', err);
      setError(err.message || 'Failed to load health coach data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCoachData();
    
    // Refresh balance in background
    refreshBalance().catch(console.error);
  }, [id]);

  const pastelColor = useMemo(() => getRandomPastelColor(coach?.name || ''), [coach?.name]);
  const initials = useMemo(() => getInitials(coach?.name || ''), [coach?.name]);

  const handleToggleFavorite = async () => {
    if (!coach) return;

    try {
      if (favorited) {
        await removeFavorite(coach.id);
        setFavorited(false);
      } else {
        await addFavorite(coach);
        setFavorited(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  const handleSubmitQuestion = async () => {
    if (!question.trim() || sending) return;

    if (purchaseLoading) {
      Alert.alert('Loading', 'Please wait while we fetch your credit status.');
      return;
    }

    if (balance <= 0) {
      Alert.alert('Insufficient Credits', 'You need credits to ask a question. Would you like to add funds now?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Add Funds', onPress: () => router.push('/settings/add-funds') }]);
      return;
    }

    try {
      setSending(true);

      const newBalance = balance - 1;
      await AsyncStorage.setItem('credits_balance', newBalance.toString());
      setBalance(newBalance);

      const newMessage: Message = { 
        id: Date.now().toString(), 
        text: question, 
        sender: 'user', 
        timestamp: new Date() 
      };
      
      setConversation((prev) => [...prev, newMessage]);
      setQuestion('');

      // If not already favorited, add to favorites
      if (!favorited && coach) {
        await addFavorite(coach);
        setFavorited(true);
      }

      // Simulate coach response after a delay
      setTimeout(() => {
        const response: Message = { 
          id: (Date.now() + 1).toString(), 
          text: `Thank you for your question about ${coach?.specialty || 'health coaching'}. I'll provide you with personalized advice based on my ${coach?.years_experience || 'many'} years of experience. I'll respond within the next couple of hours.`, 
          sender: 'health_coach', 
          timestamp: new Date() 
        };
        setConversation((prev) => [...prev, response]);
        setSending(false);
      }, 1000);
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('Failed to send question. Please try again.');
      setSending(false);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

  const handleBackPress = () => router.back();

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadCoachData();
  };

  if (loading || purchaseLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{loading ? 'Loading health coach profile...' : 'Verifying account status...'}</Text>
        <Text style={styles.loadingSubtext}>Please wait a moment</Text>
      </View>
    );
  }

  if (error || !coach) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Failed to load profile. Check your connection and try again.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ImageBackground source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }} style={styles.headerBackground}>
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']} style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.initialsCircle, { backgroundColor: pastelColor }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{coach.name}</Text>
                <Text style={styles.specialty}>{coach.specialty}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.rating}>{(coach.rating || 5.0).toFixed(1)}</Text>
                  <Text style={styles.reviews}>({coach.reviews_count || 0} reviews)</Text>
                </View>
                {coach.location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color="#6366f1" />
                    <Text style={styles.location}>{coach.location}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
                <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={24} color={favorited ? '#ef4444' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bio}>{coach.bio || `I am a professional ${coach.specialty} coach with ${coach.years_experience || 'several'} years of experience. I specialize in helping clients achieve their health and wellness goals through personalized coaching and support.`}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{coach.years_experience || 'N/A'} years</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{(coach.rating || 5.0).toFixed(1)}/5.0</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Reviews</Text>
              <Text style={styles.detailValue}>{coach.reviews_count || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${coach.price || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name={coach.is_verified ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Verified</Text>
              <Text style={styles.detailValue}>{coach.is_verified ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name={coach.is_online ? "checkmark-done-circle" : "checkmark-done-circle-outline"} size={20} color="#6366f1" />
              <Text style={styles.detailLabel}>Available</Text>
              <Text style={styles.detailValue}>{coach.is_online ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.sectionTitle}>Ask a Question</Text>
          <Text style={styles.creditStatus}>Credits: {balance}</Text>
          <TextInput style={styles.input} placeholder="Type your question here..." placeholderTextColor="#666666" value={question} onChangeText={setQuestion} multiline numberOfLines={4} editable={!sending} />
          <TouchableOpacity style={[styles.submitButton, (sending || !question.trim()) && styles.submitButtonDisabled]} onPress={handleSubmitQuestion} disabled={sending || !question.trim()}>
            {sending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>Send Question</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.conversationSection}>
          <Text style={styles.sectionTitle}>Conversation History</Text>
          {conversation.length === 0 ? (
            <View style={styles.emptyConversation}>
              <Ionicons name="chatbubble-outline" size={48} color="#333333" />
              <Text style={styles.emptyConversationText}>No messages yet. Start the conversation by asking a question.</Text>
            </View>
          ) : (
            conversation.map((message) => (
              <View key={message.id} style={[styles.messageContainer, message.sender === 'user' ? styles.userMessage : styles.coachMessage]}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSender}>{message.sender === 'user' ? 'You' : coach.name}</Text>
                  <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                </View>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1e293b', fontSize: 16, marginTop: 16 },
  loadingSubtext: { color: '#64748b', fontSize: 14, marginTop: 8 },
  errorContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#1e293b', fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryButton: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerBackground: { width: '100%', height: 300 },
  headerOverlay: { width: '100%', height: '100%', paddingTop: 60 },
  header: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  initialsCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#6366f1' },
  initials: { fontSize: 32, fontWeight: '600', color: '#1a1a1a' },
  headerInfo: { marginLeft: 15, flex: 1 },
  favoriteButton: { padding: 8, alignSelf: 'flex-start' },
  name: { fontSize: 24, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  specialty: { fontSize: 16, color: '#94a3b8', marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rating: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginLeft: 4 },
  reviews: { fontSize: 14, color: '#94a3b8', marginLeft: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  location: { fontSize: 14, color: '#94a3b8', marginLeft: 4 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  bio: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  detailItem: { alignItems: 'center', width: '33%', marginBottom: 16 },
  detailLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  detailValue: { fontSize: 14, color: '#1e293b', marginTop: 2, textAlign: 'center' },
  questionSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  creditStatus: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, color: '#1e293b', fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  submitButton: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  submitButtonDisabled: { backgroundColor: '#94a3b8' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  conversationSection: { padding: 20, backgroundColor: '#ffffff' },
  emptyConversation: { alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f1f5f9', borderRadius: 12 },
  emptyConversationText: { color: '#64748b', fontSize: 16, textAlign: 'center', marginTop: 16 },
  messageContainer: { marginBottom: 16, padding: 16, borderRadius: 12 },
  userMessage: { backgroundColor: '#f1f5f9', marginLeft: 32 },
  coachMessage: { backgroundColor: '#eef2ff', marginRight: 32 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  messageSender: { color: '#1e293b', fontWeight: '600', fontSize: 14 },
  messageTime: { color: '#64748b', fontSize: 12 },
  messageText: { color: '#1e293b', fontSize: 16, lineHeight: 24 },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#ffffff', marginLeft: 20 },
  content: { flexGrow: 1 },
});