import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    locationSharing: false,
    activityStatus: true,
    readReceipts: true,
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.closeButtonCircle}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Profile Visibility</Text>
            <Text style={styles.settingDescription}>Make your profile visible to others</Text>
          </View>
          <Switch
            value={privacy.profileVisibility}
            onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={privacy.profileVisibility ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Location Sharing</Text>
            <Text style={styles.settingDescription}>Share your location with psychics</Text>
          </View>
          <Switch
            value={privacy.locationSharing}
            onValueChange={(value) => setPrivacy({ ...privacy, locationSharing: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={privacy.locationSharing ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Activity Status</Text>
            <Text style={styles.settingDescription}>Show when you're active</Text>
          </View>
          <Switch
            value={privacy.activityStatus}
            onValueChange={(value) => setPrivacy({ ...privacy, activityStatus: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={privacy.activityStatus ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Read Receipts</Text>
            <Text style={styles.settingDescription}>Show when you've read messages</Text>
          </View>
          <Switch
            value={privacy.readReceipts}
            onValueChange={(value) => setPrivacy({ ...privacy, readReceipts: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={privacy.readReceipts ? '#ffffff' : '#94a3b8'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerItem}>
          <View style={styles.settingContent}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerDescription}>Permanently delete your account and data</Text>
          </View>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#111111',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
});