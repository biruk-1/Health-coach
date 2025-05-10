import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Define the TabLayout as a regular function component
function TabLayout() {
  const { user } = useAuth();
  
  // Don't render tabs at all if there's no authenticated user
  if (!user) {
    return null;
  }

  return (
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
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, size, color }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <View style={styles.activeTab}>
                  <Ionicons name="home" size={size} color="#6366f1" />
                </View>
              ) : (
                <Ionicons name="home-outline" size={size} color={color} />
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
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 5,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export the function directly instead of the memoized component
export default TabLayout;