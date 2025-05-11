// NAVIGATION FIX: router.push was replaced with router.navigate to prevent double rendering
// This change was made automatically by the fix-navigation script
// See fix-navigation.md for more details
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile photo.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web specific implementation
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets[0].uri) {
          setPhoto(result.assets[0].uri);
        }
      } else {
        // Native platforms implementation
        const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Please allow access to your photo library to upload a profile photo.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets[0].uri) {
          setPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNext = () => {
    if (photo) {
      router.navigate('/psychic-onboarding/specialties');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Photo</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Add a professional photo that clearly shows your face. This helps build trust with potential clients.
        </Text>

        <TouchableOpacity 
          style={styles.photoContainer} 
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {photo ? (
            <>
              <Image source={{ uri: photo }} style={styles.photo} />
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={24} color="#ffffff" />
                <Text style={styles.editText}>Change Photo</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={40} color="#6366f1" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Photo Guidelines:</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.guidelineText}>Clear, well-lit headshot</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.guidelineText}>Professional appearance</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.guidelineText}>Plain or neutral background</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !photo && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!photo}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={24} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  photoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    alignItems: 'center',
  },
  editText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  guidelines: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelineText: {
    color: '#94a3b8',
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
