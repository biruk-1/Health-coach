import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Platform } from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { HealthCoach } from '../../services/database';

export default function FavoritesScreen() {
  const { favorites = [], removeFavorite, loading } = useFavorites();
  const { user } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="log-in" size={64} color="#94a3b8" />
        <Text style={styles.emptyText}>Please log in to view your favorites</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Ensure favorites is an array before checking length
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  
  if (favoritesList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyText}>No favorites yet. Start adding your favorite coaches!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorite Coaches</Text>
      </View>

      <FlatList
        data={favoritesList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push(`/${item.id}` as any);
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
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.specialty}>{item.specialty}</Text>
                <View style={styles.stats}>
                  <Text style={styles.rating}>⭐️ {(item.rating || 5.0).toFixed(1)}</Text>
                  <Text style={styles.reviews}>({item.reviews_count || 0})</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 200,
    backgroundColor: '#ffffff',
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
  },
  specialty: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 8,
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
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#e5e7eb',
    marginLeft: 4,
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
});