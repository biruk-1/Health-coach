import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheOptions {
  expiryMs?: number; // Time in milliseconds until the cache expires
}

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiryMs?: number;
};

class Cache {
  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        expiryMs: options.expiryMs
      };
      
      const jsonValue = JSON.stringify(cacheItem);
      await AsyncStorage.setItem(`cache_${key}`, jsonValue);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`cache_${key}`);
      
      if (!jsonValue) {
        return null;
      }
      
      const cacheItem = JSON.parse(jsonValue) as CacheItem<T>;
      
      // Check if the cache has expired
      if (cacheItem.expiryMs && (Date.now() - cacheItem.timestamp > cacheItem.expiryMs)) {
        await this.remove(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Remove a value from the cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get all cache keys
   */
  async getKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith('cache_'))
        .map(key => key.replace('cache_', ''));
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }
}

export const cache = new Cache(); 