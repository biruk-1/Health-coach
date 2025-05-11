// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action: () => void;
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 428;

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [balance, setBalance] = useState(0);

  const handleSignOut = async () => {
    try {
      await logout();
      await AsyncStorage.clear();
      Alert.alert('Success', 'You have logged out successfully');
      router.replace('/onboarding');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const settings: SettingItem[] = [
    {
      icon: 'wallet',
      title: 'Add Funds',
      description: 'Add money to your account balance',
      action: () => router.navigate('/settings/add-funds'),
    },
    {
      icon: 'person',
      title: 'Account',
      description: 'Manage your account details',
      action: () => router.navigate('/settings/account'),
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      description: 'Get help with using the app',
      action: () => router.navigate('/settings/help'),
    },
    {
      icon: 'information-circle',
      title: 'About',
      description: 'Learn more about our app',
      action: () => router.navigate('/settings/about'),
    },
  ];

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safeAreaBottom}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet-outline" size={24} color="#6366f1" />
            <Text style={styles.balanceTitle}>Current Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={() => router.navigate('/settings/add-funds')}
          >
            <Text style={styles.addFundsText}>Add Funds</Text>
            <Ionicons name="add-circle" size={20} color="#ffffff" style={styles.addIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          {settings.map((setting, index) => (
            <TouchableOpacity
              key={setting.title}
              style={[
                styles.settingItem,
                index !== settings.length - 1 && styles.settingItemBorder,
              ]}
              onPress={setting.action}
            >
              <View style={styles.settingIcon}>
                <Ionicons name={setting.icon} size={24} color="#6366f1" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>{setting.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingHorizontal: isSmallScreen ? 12 : isLargeScreen ? 20 : 16,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 12,
    padding: isSmallScreen ? 12 : isLargeScreen ? 20 : 16,
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: isSmallScreen ? 15 : isLargeScreen ? 18 : 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: isSmallScreen ? 24 : isLargeScreen ? 32 : 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  addFundsButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: isSmallScreen ? 10 : isLargeScreen ? 14 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
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
  addFundsText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : isLargeScreen ? 18 : 16,
    fontWeight: '600',
    marginRight: 8,
  },
  addIcon: {
    marginLeft: 4,
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 12,
    overflow: 'hidden',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isSmallScreen ? 12 : isLargeScreen ? 20 : 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingIcon: {
    width: isSmallScreen ? 36 : isLargeScreen ? 44 : 40,
    height: isSmallScreen ? 36 : isLargeScreen ? 44 : 40,
    borderRadius: isSmallScreen ? 18 : isLargeScreen ? 22 : 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: isSmallScreen ? 15 : isLargeScreen ? 18 : 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: isSmallScreen ? 13 : isLargeScreen ? 15 : 14,
    color: '#64748b',
  },
  signOutButton: {
    marginVertical: 16,
    padding: isSmallScreen ? 12 : isLargeScreen ? 20 : 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  signOutText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : isLargeScreen ? 18 : 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: isSmallScreen ? 13 : isLargeScreen ? 15 : 14,
    marginBottom: isSmallScreen ? 24 : isLargeScreen ? 40 : 32,
  },
});
