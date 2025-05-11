// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Platform, StatusBar, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { HealthCoach } from '../../services/database';
import { Dimensions } from 'react-native';
import { useState, useCallback } from 'react';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 428;

export default function FavoritesScreen() {
  const { favorites = [], removeFavorite, loading, refreshFavorites } = useFavorites();
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Automatically refresh favorites when screen is mounted
  useEffect(() => {
    console.log('FavoritesScreen mounted, refreshing favorites...');
    refreshFavorites();
  }, []);

  // Log favorites changes for debugging
  useEffect(() => {
    console.log(`Favorites updated: ${favorites.length} items`);
    const info = `Total favorites: ${favorites.length}\n${favorites.map(f => `- ${f.name} (${f.id})`).join('\n')}`;
    setDebugInfo(info);
  }, [favorites]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('Manually refreshing favorites...');
      await refreshFavorites();
    } catch (error) {
      console.error('Error refreshing favorites:', error);
      Alert.alert('Refresh Error', 'Could not refresh favorites. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshFavorites]);

  const handleRemoveFavorite = async (id: string, name: string) => {
    try {
      console.log(`Removing favorite: ${name} (${id})`);
      await removeFavorite(id);
      // No need for manual state updates - handled by context
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Could not remove favorite. Please try again.');
    }
  };

  // Show debug info when long-pressing the header (for development)
  const showDebugInfo = () => {
    Alert.alert('Favorites Debug Info', debugInfo);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
        <LinearGradient 
          colors={['#4f46e5', '#6366f1']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
          style={styles.headerBackground}
        >
          <SafeAreaView style={styles.safeAreaTop}>
            <TouchableOpacity onLongPress={showDebugInfo} activeOpacity={0.8}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Favorites</Text>
                <Text style={styles.headerSubtitle}>Your saved health coaches</Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
        
        <SafeAreaView style={styles.safeAreaBottom}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
        <LinearGradient 
          colors={['#4f46e5', '#6366f1']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
          style={styles.headerBackground}
        >
          <SafeAreaView style={styles.safeAreaTop}>
            <TouchableOpacity onLongPress={showDebugInfo} activeOpacity={0.8}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Favorites</Text>
                <Text style={styles.headerSubtitle}>Your saved health coaches</Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
        
        <SafeAreaView style={styles.safeAreaBottom}>
      <View style={styles.emptyContainer}>
        <Ionicons name="log-in" size={64} color="#94a3b8" />
        <Text style={styles.emptyText}>Please log in to view your favorites</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.navigate('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Ensure favorites is an array before checking length
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  
  if (favoritesList.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
        <LinearGradient 
          colors={['#4f46e5', '#6366f1']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
          style={styles.headerBackground}
        >
          <SafeAreaView style={styles.safeAreaTop}>
            <TouchableOpacity onLongPress={showDebugInfo} activeOpacity={0.8}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Favorites</Text>
                <Text style={styles.headerSubtitle}>Your saved health coaches</Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
        
        <SafeAreaView style={styles.safeAreaBottom}>
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyText}>No favorites yet. Start adding your favorite coaches!</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.navigate('/')}
            >
              <Text style={styles.browseButtonText}>Browse Coaches</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
      <LinearGradient 
        colors={['#4f46e5', '#6366f1']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
        style={styles.headerBackground}
      >
        <SafeAreaView style={styles.safeAreaTop}>
          <TouchableOpacity onLongPress={showDebugInfo} activeOpacity={0.8}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Favorites</Text>
              <Text style={styles.headerSubtitle}>Your saved health coaches</Text>
      </View>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safeAreaBottom}>
      <FlatList
        data={favoritesList}
        keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor={'#6366f1'}
            />
          }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
                if (item && item.id) {
                  router.navigate(`/${item.id}`);
                } else {
                  console.error('Invalid coach data:', item);
                  Alert.alert('Error', 'Could not open coach details');
                }
            }}
          >
            <ImageBackground
              source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1495482432709-15807c8b3e2b?q=80&w=1000&auto=format&fit=crop' }}
              style={styles.cardImage}
              imageStyle={{ borderRadius: 8 }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              >
                  <Text style={styles.name}>{item.name || 'Unknown Coach'}</Text>
                  <Text style={styles.specialty}>{item.specialty || 'Health Coach'}</Text>
                <View style={styles.stats}>
                    <Text style={styles.rating}>⭐️ {typeof item.rating === 'number' 
                      ? item.rating.toFixed(1) 
                      : typeof item.rating === 'string' && !isNaN(parseFloat(item.rating))
                        ? parseFloat(item.rating).toFixed(1) 
                        : '5.0'}</Text>
                  <Text style={styles.reviews}>({item.reviews_count || 0})</Text>
                </View>
              </LinearGradient>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(item.id, item.name || 'Unknown Coach');
                  }}
                >
                  <Ionicons name="close" size={18} color="#6b7280" />
                </TouchableOpacity>
            </ImageBackground>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeAreaTop: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  safeAreaBottom: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 22 : isLargeScreen ? 28 : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: isSmallScreen ? 13 : isLargeScreen ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  specialty: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reviews: {
    fontSize: 14,
    color: '#e5e7eb',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  browseButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
