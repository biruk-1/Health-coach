import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action: () => void;
};

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
      action: () => router.push('/settings/add-funds'),
    },
    {
      icon: 'person',
      title: 'Account',
      description: 'Manage your account details',
      action: () => router.push('/settings/account'),
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      description: 'Get help with using the app',
      action: () => router.push('/settings/help'),
    },
    {
      icon: 'information-circle',
      title: 'About',
      description: 'Learn more about our app',
      action: () => router.push('/settings/about'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet-outline" size={24} color="#6366f1" />
          <Text style={styles.balanceTitle}>Current Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        <TouchableOpacity 
          style={styles.addFundsButton}
          onPress={() => router.push('/settings/add-funds')}
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

      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
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
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
    marginLeft:'30%'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
     marginLeft:'15%',
     fontWeight:'500'
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  addFundsButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
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
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  addIcon: {
    marginLeft: 4,
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
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
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});