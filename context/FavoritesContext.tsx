import React, { createContext, useContext, useState, useEffect } from 'react';
import { HealthCoach, cachedCoaches, getHealthCoachById } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addFavoriteCoach, removeFavoriteCoach, getFavoriteCoaches } from '../services/api';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

type FavoritesContextType = {
  favorites: HealthCoach[];
  addFavorite: (coach: HealthCoach) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Storage key for favorites
const FAVORITES_STORAGE_KEY = 'health_coach_favorites';
// Storage key for favorite IDs only
const FAVORITE_IDS_STORAGE_KEY = 'health_coach_favorite_ids';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<HealthCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Load favorites from storage or server on mount or when user changes
  useEffect(() => {
    loadFavorites();
  }, [user]);

  // Get coach details from local cache by ID
  const getCoachFromLocalCache = async (coachId: string): Promise<HealthCoach | null> => {
    try {
      // First check in-memory cache (faster)
      if (cachedCoaches && cachedCoaches.length > 0) {
        const coach = cachedCoaches.find(c => c.id === coachId);
        if (coach) return coach;
      }
      
      // If not found in memory, try to fetch from database
      return await getHealthCoachById(coachId);
    } catch (error) {
      console.error(`Error fetching coach ${coachId} from local cache:`, error);
      return null;
    }
  };

  // Convert favorite IDs to full coach objects using local data
  const hydrateCoachesFromIds = async (ids: string[]): Promise<HealthCoach[]> => {
    const hydratedCoaches: HealthCoach[] = [];
    
    for (const id of ids) {
      const coach = await getCoachFromLocalCache(id);
      if (coach) {
        hydratedCoaches.push(coach);
      } else {
        console.warn(`Coach with ID ${id} not found in local cache`);
      }
    }
    
    return hydratedCoaches;
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // First load from local storage to ensure we always have some data
      let localFavoriteIds: string[] = [];
      let localFavorites: HealthCoach[] = [];
      
      // Try to load favorite IDs first (more efficient)
      const storedIds = await AsyncStorage.getItem(FAVORITE_IDS_STORAGE_KEY);
      if (storedIds) {
        localFavoriteIds = JSON.parse(storedIds);
        console.log(`Loaded ${localFavoriteIds.length} favorite IDs from local storage`);
        
        // Convert IDs to full coach objects using local data
        localFavorites = await hydrateCoachesFromIds(localFavoriteIds);
        console.log(`Hydrated ${localFavorites.length} coaches from local cache`);
      } else {
        // Fall back to full favorites objects if IDs not available
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
          localFavorites = JSON.parse(storedFavorites) as HealthCoach[];
          localFavoriteIds = localFavorites.map(fav => fav.id);
          console.log(`Loaded ${localFavorites.length} favorites from local storage`);
          
          // Save IDs for future use
          await AsyncStorage.setItem(FAVORITE_IDS_STORAGE_KEY, JSON.stringify(localFavoriteIds));
        }
      }
      
      // Set initial state from local storage
      setFavorites(localFavorites);
      setFavoriteIds(new Set(localFavoriteIds));
      
      // If user is logged in, try to get favorites from server
      if (user) {
        try {
          console.log('Loading favorites from server for user:', user.id);
          const serverFavorites = await getFavoriteCoaches(user.id);
          
          if (serverFavorites && serverFavorites.length > 0) {
            console.log(`Loaded ${serverFavorites.length} favorites from server`);
            
            // Update with server data - server is source of truth if available
            setFavorites(serverFavorites);
            const serverIds = serverFavorites.map(fav => fav.id);
            setFavoriteIds(new Set(serverIds));
            
            // Update local storage with server data
            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(serverFavorites));
            await AsyncStorage.setItem(FAVORITE_IDS_STORAGE_KEY, JSON.stringify(serverIds));
          } else if (localFavoriteIds.length > 0) {
            console.log('No favorites found from server, syncing local favorites to server');
            syncLocalFavoritesToServer(localFavorites, user.id);
          }
        } catch (error) {
          console.error('Error loading favorites from server:', error);
          // Already set from local storage, so no need to update state
        }
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      // Initialize with empty arrays on error
      setFavorites([]);
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Helper to sync local favorites to server
  const syncLocalFavoritesToServer = async (localFavorites: HealthCoach[], userId: string) => {
    for (const coach of localFavorites) {
      try {
        await addFavoriteCoach(userId, coach.id);
      } catch (error) {
        console.warn(`Failed to sync favorite ${coach.id} to server:`, error);
      }
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  const saveFavoritesToStorage = async (favoritesArray: HealthCoach[]) => {
    try {
      // Save both the full objects and just the IDs
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
      const ids = favoritesArray.map(fav => fav.id);
      await AsyncStorage.setItem(FAVORITE_IDS_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  };

  const addFavorite = async (coach: HealthCoach) => {
    try {
      // Check if already favorited
      if (!favoriteIds.has(coach.id)) {
        // Update local state first for immediate UI feedback
        const updatedFavorites = [...favorites, coach];
        setFavorites(updatedFavorites);
        setFavoriteIds(new Set([...favoriteIds, coach.id]));
        
        // Save to storage
        await saveFavoritesToStorage(updatedFavorites);
        
        // If user is authenticated, also save to server
        if (user) {
          const success = await addFavoriteCoach(user.id, coach.id);
          if (!success) {
            console.warn('Failed to add favorite to server, but saved locally');
          }
        }
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
      // Alert the user
      Alert.alert(
        "Error",
        "There was a problem adding to favorites. Please try again later.",
        [{ text: "OK" }]
      );
      
      // Revert on error
      setFavorites(prev => prev.filter(c => c.id !== coach.id));
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(coach.id);
        return newSet;
      });
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      // Get coach info before removal for possible revert
      const coachToRemove = favorites.find(coach => coach.id === id);
      
      // Remove from state first for immediate UI feedback
      const updatedFavorites = favorites.filter(coach => coach.id !== id);
      setFavorites(updatedFavorites);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Save to storage
      await saveFavoritesToStorage(updatedFavorites);
      
      // If user is authenticated, also remove from server
      if (user) {
        const success = await removeFavoriteCoach(user.id, id);
        if (!success) {
          console.warn('Failed to remove favorite from server, but removed locally');
        }
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      // Alert the user
      Alert.alert(
        "Error",
        "There was a problem removing from favorites. Please try again later.",
        [{ text: "OK" }]
      );
      
      // Reload favorites on error
      loadFavorites();
    }
  };

  const isFavorite = (id: string): boolean => {
    return favoriteIds.has(id);
  };

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addFavorite, 
      removeFavorite, 
      isFavorite, 
      loading,
      refreshFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}