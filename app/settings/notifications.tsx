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

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    readings: true,
    messages: true,
    promotions: false,
    newsletter: true,
    reminders: true,
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
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Reading Updates</Text>
            <Text style={styles.settingDescription}>Get notified about your reading status</Text>
          </View>
          <Switch
            value={notifications.readings}
            onValueChange={(value) => setNotifications({ ...notifications, readings: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={notifications.readings ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Messages</Text>
            <Text style={styles.settingDescription}>Receive notifications for new messages</Text>
          </View>
          <Switch
            value={notifications.messages}
            onValueChange={(value) => setNotifications({ ...notifications, messages: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={notifications.messages ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Promotions</Text>
            <Text style={styles.settingDescription}>Get notified about special offers</Text>
          </View>
          <Switch
            value={notifications.promotions}
            onValueChange={(value) => setNotifications({ ...notifications, promotions: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={notifications.promotions ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Newsletter</Text>
            <Text style={styles.settingDescription}>Receive our weekly newsletter</Text>
          </View>
          <Switch
            value={notifications.newsletter}
            onValueChange={(value) => setNotifications({ ...notifications, newsletter: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={notifications.newsletter ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Reminders</Text>
            <Text style={styles.settingDescription}>Get reminded about scheduled readings</Text>
          </View>
          <Switch
            value={notifications.reminders}
            onValueChange={(value) => setNotifications({ ...notifications, reminders: value })}
            trackColor={{ false: '#222222', true: '#6366f1' }}
            thumbColor={notifications.reminders ? '#ffffff' : '#94a3b8'}
          />
        </View>
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
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
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
});