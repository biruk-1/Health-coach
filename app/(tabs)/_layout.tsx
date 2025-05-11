import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppInitialization } from '@hooks/useAppInitialization';
import { useNavigationGuard } from '@hooks/useNavigationGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearNavigationLocks } from '../../lib/navigation';

// Simple optimized tab layout
function TabLayout() {
  // State
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  // Initialize on first render
  useEffect(() => {
    // Short delay for smoother transitions
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Clear navigation locks when tabs layout loads
  useEffect(() => {
    const setupTabsNavigation = async () => {
      try {
        // Clear any existing navigation locks when entering the tabs
        await clearNavigationLocks();
        console.log('TabLayout: Cleared navigation locks for clean tab navigation');
      } catch (error) {
        console.error('TabLayout: Error clearing navigation locks:', error);
      }
    };
    
    setupTabsNavigation();
  }, []);

  // Tab configuration
  const tabScreens = useMemo(() => (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
            android: {
              elevation: 10,
            },
          }),
        },
        tabBarItemStyle: {
          padding: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 5 : 3,
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Health Coaches',
          headerShown: false,
          tabBarIcon: ({ focused, size, color }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <View style={styles.activeTab}>
                  <Ionicons name="people" size={size} color="#6366f1" />
                </View>
              ) : (
                <Ionicons name="people-outline" size={size} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          headerShown: false,
          tabBarIcon: ({ focused, size, color }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <View style={styles.activeTab}>
                  <Ionicons name="heart" size={size} color="#6366f1" />
                </View>
              ) : (
                <Ionicons name="heart-outline" size={size} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask Coach AI',
          headerShown: false,
          tabBarIcon: ({ focused, size, color }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <View style={styles.activeTab}>
                  <Ionicons name="fitness" size={size} color="#6366f1" />
                </View>
              ) : (
                <Ionicons name="fitness-outline" size={size} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused, size, color }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <View style={styles.activeTab}>
                  <Ionicons name="settings" size={size} color="#6366f1" />
                </View>
              ) : (
                <Ionicons name="settings-outline" size={size} color={color} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  ), []);

  // Don't render without user or before ready
  if (!user) {
    return null;
  }

  // Show loading state before ready
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return tabScreens;
}

// Efficient memoized styles
const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

// Export a memoized component to prevent unnecessary re-renders
export default React.memo(TabLayout);