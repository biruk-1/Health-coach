import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HealthCoach } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FavoritesContextType = {
  favorites: HealthCoach[];
  addFavorite: (coach: HealthCoach) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => Promise<boolean>;
  loading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Storage key for favorites
const FAVORITES_STORAGE_KEY = 'health_coach_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<HealthCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Load from AsyncStorage
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const favoritesArray = JSON.parse(storedFavorites) as HealthCoach[];
        setFavorites(favoritesArray);
        setFavoriteIds(new Set(favoritesArray.map(fav => fav.id)));
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

  const saveFavoritesToStorage = async (favoritesArray: HealthCoach[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  };

  const addFavorite = async (coach: HealthCoach) => {
    try {
      // Check if already favorited
      if (!favoriteIds.has(coach.id)) {
        const updatedFavorites = [...favorites, coach];
        setFavorites(updatedFavorites);
        setFavoriteIds(new Set([...favoriteIds, coach.id]));
        
        // Save to storage
        await saveFavoritesToStorage(updatedFavorites);
        
        // If authenticated, also save to Supabase (optional)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('favorites')
            .upsert({
              user_id: user.id,
              coach_id: coach.id,
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
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
      // Remove from state
      const updatedFavorites = favorites.filter(coach => coach.id !== id);
      setFavorites(updatedFavorites);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Save to storage
      await saveFavoritesToStorage(updatedFavorites);
      
      // If authenticated, also remove from Supabase (optional)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('favorites')
          .delete()
          .match({ user_id: user.id, coach_id: id });
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      // Reload favorites on error
      loadFavorites();
    }
  };

  const isFavorite = async (id: string): Promise<boolean> => {
    return favoriteIds.has(id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, loading }}>
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