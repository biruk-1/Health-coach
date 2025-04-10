import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getHealthCoaches, HealthCoach, initializeDatabase } from '../../services/database';
import { useFocusEffect } from 'expo-router';

type PractitionerType = 'nutrition' | 'fitness' | 'mental' | 'sleep' | 'wellness' | 'all';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 428;

const getRandomPastelColor = (name: string) => {
  const hash = name?.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0) || 0;
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ')[0][0].toUpperCase();
};

export default function CoachesScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<PractitionerType>('all');
  const [practitioners, setPractitioners] = useState<HealthCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [totalCoaches, setTotalCoaches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Define handlePress at the top level with useCallback
  const handlePress = useCallback(async (item: HealthCoach) => {
    try {
      // Navigate to the detail page
      router.push({
        pathname: '/[id]',
        params: { id: item.id },
      });
    } catch (error) {
      console.error('Failed to navigate:', error);
      // Fallback navigation
      router.push(`/${item.id}`);
    }
  }, [router]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to initialize the database first
        await initializeDatabase();
        
        // Then check connection status
        await checkSupabaseConnection();
        
        // Always load coaches regardless of connection status
        // This will use cached data if Supabase is unavailable
        await loadCoaches();
        
        // Log the total number of coaches available
        console.log('Total coaches available in database:', totalCoaches);
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize. Please try again.');
      }
    };

    initializeData();
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      setConnectionStatus('checking');
      const { data, error } = await supabase.from('health_coaches').select('id').limit(1);
      if (error) {
        console.error('Supabase connection error:', error.message);
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('connected');
      }
    } catch (err) {
      console.error('Supabase connection check failed:', err);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    // Load coaches when selected type changes, regardless of connection status
    loadCoaches();
  }, [selectedType]);

  useFocusEffect(
    useCallback(() => {
      // Always refresh when screen is focused
      loadCoaches();
    }, [])
  );

  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        loadCoaches();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const loadCoaches = async (page = 1, append = false) => {
    try {
      console.log('==== LOAD COACHES START ====');
      console.log('loadCoaches called with page:', page, 'append:', append);
      setError(null);
      if (!isRefreshing && !append) setIsLoading(true);
      if (append) setLoadingMore(true);
      
      // Use standard page size of 20 coaches per page (faster loading)
      const pageSize = 20;
      
      const searchParams = {
        specialty: selectedType === 'all' ? undefined : selectedType,
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        rating: undefined, // Add if you implement rating filter
      };

      console.log('Fetching with params:', JSON.stringify(searchParams));
      
      const result = await getHealthCoaches(searchParams);
      
      // Detailed logging to debug any issues
      console.log(`DEBUG: Fetched ${result?.coaches?.length || 0} coaches of ${result?.total || 0} total`);
      console.log(`DEBUG: Page ${result?.page} of ${result?.totalPages}, pageSize: ${result?.pageSize}`);
      
      if (result?.coaches?.length > 0) {
        console.log('DEBUG: First coach data sample:', {
          id: result.coaches[0].id,
          name: result.coaches[0].name,
          specialty: result.coaches[0].specialty,
          rating: result.coaches[0].rating
        });
      } else {
        console.warn('No coaches returned for the current query');
      }
      
      setTotalCoaches(result?.total || 0);
      
      // Update hasMorePages based on current page and total pages
      setHasMorePages(result?.page < result?.totalPages);
      setCurrentPage(result?.page || 1);

      // Update practitioners state
      if (append) {
        setPractitioners((prev) => [...prev, ...(result?.coaches || [])]);
      } else {
        setPractitioners(result?.coaches || []);
      }

      console.log('DEBUG: State updated with coaches count:', result?.coaches?.length || 0);
      console.log('DEBUG: Current practitioners state length:', practitioners.length);
      console.log('==== LOAD COACHES END ====');
    } catch (err) {
      console.error('Failed to load coaches:', err);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setRetryCount(0);
    setCurrentPage(1);
    loadCoaches(1);
  };

  const loadMoreCoaches = () => {
    if (hasMorePages && !loadingMore) {
      console.log('Loading more coaches page:', currentPage + 1);
      setLoadingMore(true);
      // Short delay to allow the loading indicator to render
      setTimeout(() => {
        loadCoaches(currentPage + 1, true);
      }, 500);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCoaches(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadCoaches(1);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderPractitioner = ({ item }: { item: HealthCoach }) => (
    <TouchableOpacity
      style={styles.practitionerCard}
      onPress={() => handlePress(item)}
      disabled={isLoading}
    >
      <ImageBackground
        source={{
          uri: item.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop',
        }}
        style={styles.cardBackground}
      >
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']} style={styles.cardOverlay}>
          <View style={styles.cardContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {truncateText(item.name, 30)}
              </Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                </View>
              )}
            </View>
            <Text style={styles.specialty} numberOfLines={1} ellipsizeMode="tail">
              {item.specialty}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.rating}>{(item.rating || 5.0).toFixed(1)}</Text>
              <Text style={styles.reviews}>({item.reviews_count || 0} reviews)</Text>
            </View>
            {item.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#6366f1" />
                <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color="#94a3b8" />
        <Text style={styles.emptyText}>No {selectedType} coaches found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.footerText}>Loading more coaches...</Text>
        </View>
      );
    }
    
    if (hasMorePages) {
      return (
        <View style={styles.footerContainer}>
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.footerText}>Loading...</Text>
          </View>
          
          {totalCoaches > practitioners.length && (
            <TouchableOpacity 
              style={styles.loadAllButton}
              onPress={() => loadAllCoaches()}
            >
              <Text style={styles.loadAllButtonText}>Load All {totalCoaches} Coaches</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    return null;
  };

  const loadAllCoaches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading all coaches at once...');
      
      const searchParams = {
        specialty: selectedType === 'all' ? undefined : selectedType,
        page: 1,
        pageSize: totalCoaches, // Request all coaches at once
        searchTerm: searchTerm || undefined,
      };

      const result = await getHealthCoaches(searchParams);
      
      console.log(`Loaded all ${result?.coaches?.length || 0} coaches of ${result?.total || 0} total`);
      
      setPractitioners(result?.coaches || []);
      setHasMorePages(false);
      setCurrentPage(1);
      
    } catch (err) {
      console.error('Failed to load all coaches:', err);
      setError('Failed to load all coaches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.storiesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScrollContent}>
                {['All', 'Nutrition', 'Fitness', 'Mental', 'Wellness', 'Sleep'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.storyCircle, selectedType === type.toLowerCase() && styles.storyCircleActive]}
                    onPress={() => setSelectedType(type.toLowerCase() as PractitionerType)}
                  >
                    <LinearGradient colors={['#818cf8', '#6366f1']} style={styles.storyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <View style={styles.storyInner}>
                        <Ionicons name={
                          type === 'All' ? 'grid-outline' :
                          type === 'Nutrition' ? 'restaurant-outline' :
                          type === 'Fitness' ? 'barbell-outline' :
                          type === 'Mental' ? 'medkit-outline' :
                          type === 'Wellness' ? 'leaf-outline' :
                          'moon-outline'
                        } size={24} color="#6366f1" />
                      </View>
                    </LinearGradient>
                    <Text style={styles.storyText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.searchContainer}>
              {showSearch ? (
                <View style={styles.searchInputContainer}>
                  <TextInput style={styles.searchInput} placeholder="Search by name or specialty..." placeholderTextColor="#94a3b8" value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={handleSearch} autoFocus />
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(true)}>
                  <Ionicons name="search" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert('Filters', 'Filter functionality would go here')}>
                <Ionicons name="filter" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {totalCoaches > 0 && (
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                Showing {practitioners.length} of {totalCoaches} {selectedType === 'all' ? 'coaches' : selectedType + 's'} 
                {searchTerm ? ` matching "${searchTerm}"` : ''}
                {currentPage > 1 ? ` (Page ${currentPage})` : ''}
              </Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.list}>
            {[1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={styles.loadingCard}>
                <View style={styles.loadingCardInner}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.loadingCardText}>Loading...</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.floatingButton} onPress={() => router.push('/ai-coach-chat')}>
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="sparkles" size={24} color="#ffffff" />
                <Text style={styles.floatingButtonText}>Ask Coach AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadCoaches()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.storiesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScrollContent}>
              {['All', 'Nutrition', 'Fitness', 'Mental', 'Wellness', 'Sleep'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.storyCircle, selectedType === type.toLowerCase() && styles.storyCircleActive]}
                  onPress={() => setSelectedType(type.toLowerCase() as PractitionerType)}
                >
                  <LinearGradient colors={['#818cf8', '#6366f1']} style={styles.storyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.storyInner}>
                      <Ionicons name={
                        type === 'All' ? 'grid-outline' :
                        type === 'Nutrition' ? 'restaurant-outline' :
                        type === 'Fitness' ? 'barbell-outline' :
                        type === 'Mental' ? 'medkit-outline' :
                        type === 'Wellness' ? 'leaf-outline' :
                        'moon-outline'
                      } size={24} color="#6366f1" />
                    </View>
                  </LinearGradient>
                  <Text style={styles.storyText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.searchContainer}>
            {showSearch ? (
              <View style={styles.searchInputContainer}>
                <TextInput style={styles.searchInput} placeholder="Search by name or specialty..." placeholderTextColor="#94a3b8" value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={handleSearch} autoFocus />
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(true)}>
                <Ionicons name="search" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert('Filters', 'Filter functionality would go here')}>
              <Ionicons name="filter" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {totalCoaches > 0 && (
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              Showing {practitioners.length} of {totalCoaches} {selectedType === 'all' ? 'coaches' : selectedType + 's'} 
              {searchTerm ? ` matching "${searchTerm}"` : ''}
              {currentPage > 1 ? ` (Page ${currentPage})` : ''}
            </Text>
          </View>
        )}

        <FlatList
          data={practitioners}
          renderItem={renderPractitioner}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, practitioners.length === 0 && styles.emptyList]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
          onEndReached={loadMoreCoaches}
          onEndReachedThreshold={0.3}
          maxToRenderPerBatch={15}
          initialNumToRender={15}
          windowSize={12}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => (
            {length: 216, offset: 216 * index, index}
          )}
        />

        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity style={styles.floatingButton} onPress={() => router.push('/ai-coach-chat')}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="sparkles" size={24} color="#ffffff" />
              <Text style={styles.floatingButtonText}>Ask Coach AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    position: 'relative', 
    paddingBottom: Platform.OS === 'ios' ? 100 : 80 
  },
  header: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 45 : 5 + (StatusBar.currentHeight || 0), // Adjust for status bar on Android
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 3 
      }, 
      android: { 
        elevation: 2 
      } 
    }),
  },
  storiesContainer: { marginBottom: Platform.OS === 'ios' ? 6 : 4, alignItems: 'center', paddingTop: 2, width: '100%' },
  storiesScrollContent: { paddingHorizontal: 8, paddingVertical: Platform.OS === 'ios' ? 1 : 0, justifyContent: 'flex-start', flexDirection: 'row', flexWrap: 'nowrap' },
  storyCircle: { alignItems: 'center', marginHorizontal: 6, width: 75 },
  storyCircleActive: { transform: [{ scale: 1.02 }] },
  storyGradient: { width: 80, height: 45, borderRadius: 22.5, padding: 2, marginBottom: 4, ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 }, android: { elevation: 2 } }) },
  storyInner: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 1 } }) },
  storyText: { color: '#475569', fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 1, width: '100%', ...Platform.select({ ios: { textShadowColor: 'rgba(0, 0, 0, 0.05)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 } }) },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 6, alignItems: 'center', backgroundColor: '#f1f5f9' },
  searchInputContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 }, android: { elevation: 1 } }) },
  searchInput: { flex: 1, color: '#1e293b', fontSize: 13, paddingVertical: Platform.OS === 'ios' ? 8 : 6 },
  clearButton: { padding: 4 },
  searchButton: { backgroundColor: '#6366f1', borderRadius: 10, padding: Platform.OS === 'ios' ? 8 : 6, marginRight: 6, ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 }, android: { elevation: 2 } }) },
  filterButton: { backgroundColor: '#6366f1', borderRadius: 10, padding: Platform.OS === 'ios' ? 8 : 6, ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 }, android: { elevation: 2 } }) },
  resultsInfo: { padding: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  resultsText: { color: '#64748b', fontSize: 11, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderRadius: 12, margin: 16 },
  emptyText: { color: '#4b5563', fontSize: 16, marginTop: 16, marginBottom: 16, textAlign: 'center' },
  practitionerCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, height: 200, backgroundColor: '#ffffff' },
  cardBackground: { width: '100%', height: '100%' },
  cardOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  cardContent: { width: '100%' },
  nameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '600', color: '#ffffff', flex: 1 },
  verifiedBadge: { marginLeft: 8, backgroundColor: '#ffffff', borderRadius: 12, padding: 4 },
  specialty: { fontSize: 14, color: '#e5e7eb', marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rating: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginLeft: 4 },
  reviews: { fontSize: 14, color: '#e5e7eb', marginLeft: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  location: { fontSize: 14, color: '#e5e7eb', marginLeft: 4 },
  floatingButtonContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, zIndex: 9999, elevation: 5, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  floatingButton: { borderRadius: 25, overflow: 'hidden', elevation: 5, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, backgroundColor: '#6366f1', ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 5 } }) },
  floatingButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  loadingContainer: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4b5563', fontSize: 16, marginTop: 16 },
  loadingCard: { 
    height: 200, 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    marginBottom: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 3 
      }, 
      android: { 
        elevation: 2 
      } 
    }),
  },
  loadingCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingCardText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: { color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryButton: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16 },
  footerText: { color: '#4b5563', fontSize: 14, marginLeft: 8 },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  loadAllButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
    ...Platform.select({ 
      ios: { 
        shadowColor: '#6366f1', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 3 
      }, 
      android: { 
        elevation: 2 
      } 
    }),
  },
  loadAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});