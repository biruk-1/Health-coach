import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../context/OnboardingContext';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoachOnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Personal Info & Bio
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bio, setBio] = useState('');

  // Step 2: Credentials & Experience
  const [isCertified, setIsCertified] = useState<boolean | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certificationProof, setCertificationProof] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Step 3: Your Coaching Focus
  const [coachingSpecialties, setCoachingSpecialties] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [testimonialPhotos, setTestimonialPhotos] = useState<string[]>([]);

  // Step 4: Coaching Style
  const [coachingStyle, setCoachingStyle] = useState<string[]>([]);
  const [preferredFormat, setPreferredFormat] = useState<string[]>([]);

  // Step 5: Availability
  const [clientCapacity, setClientCapacity] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);

  // Step 6: Pricing & Offers
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState<'session' | 'month' | null>(null);
  const [offerFreeIntro, setOfferFreeIntro] = useState<boolean>(false);
  const [packages, setPackages] = useState('');

  // Step 7: AI Integration Preferences
  const [aiHelp, setAiHelp] = useState<string[]>([]);
  const [aiHandsOn, setAiHandsOn] = useState<'light' | 'moderate' | 'full' | null>(null);

  const handleBack = () => {
    if (loading) return;
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrorMessage(null);
    } else {
      router.back();
    }
  };

  const toggleArrayItem = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };        

  const pickImage = async (setState: React.Dispatch<React.SetStateAction<string | null>>) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setState(result.assets[0].uri);
    }
  };

  const pickMultipleImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setTestimonialPhotos(result.assets.map(asset => asset.uri));
    }
  };

  const handleNext = async () => {
    if (loading) return;

    if (currentStep < 12) {
      // Validate current step
      let canProceed = true;
      
      // Simplified validation for each step
      switch (currentStep) {
        case 1:
          if (!fullName.trim()) {
            setErrorMessage("Please enter your full name");
            canProceed = false;
          } else if (!location.trim()) {
            setErrorMessage("Please enter your location");
            canProceed = false;
          }
          break;
        case 2:
          if (!bio.trim()) {
            setErrorMessage("Please enter your bio");
            canProceed = false;
          }
          break;
        case 3:
          // Profile photo is optional, but encourage it
          if (!profilePhoto) {
            setErrorMessage("A profile photo is highly recommended");
            // Allow proceeding anyway
          }
          break;
        case 4:
          if (isCertified === null) {
            setErrorMessage("Please indicate if you're certified");
            canProceed = false;
          } else if (isCertified && certifications.length === 0) {
            setErrorMessage("Please add your certifications");
            canProceed = false;
          }
          break;
        case 5:
          if (!experience) {
            setErrorMessage("Please select your experience level");
            canProceed = false;
          }
          break;
        case 6:
          if (coachingSpecialties.length === 0) {
            setErrorMessage("Please select at least one specialty");
            canProceed = false;
          }
          break;
        case 7:
          if (targetAudience.length === 0) {
            setErrorMessage("Please select your target audience");
            canProceed = false;
          }
          break;
        case 8:
          if (coachingStyle.length === 0) {
            setErrorMessage("Please select your coaching style");
            canProceed = false;
          }
          break;
        case 9:
          if (preferredFormat.length === 0) {
            setErrorMessage("Please select your preferred format");
            canProceed = false;
          }
          break;
        case 10:
          if (clientCapacity === null) {
            setErrorMessage("Please select your client capacity");
            canProceed = false;
          } else if (availability.length === 0) {
            setErrorMessage("Please select your availability");
            canProceed = false;
          }
          break;
        case 11:
          if (!rate.trim()) {
            setErrorMessage("Please enter your rate");
            canProceed = false;
          } else if (rateType === null) {
            setErrorMessage("Please select your rate type");
            canProceed = false;
          }
          break;
        case 12:
          if (aiHandsOn === null) {
            setErrorMessage("Please select your AI integration preference");
            canProceed = false;
          }
          break;
      }
      
      if (canProceed) {
        setCurrentStep(prev => prev + 1);
        setErrorMessage(null);
      }
    } else {
      // Submit onboarding data
      try {
        setLoading(true);
        setErrorMessage(null);
        
        // Save coach profile data
        const coachProfileData = {
          fullName,
          gender,
          location,
          profilePhoto,
          bio,
          isCertified,
          certifications,
          certificationProof,
          experience,
          specialties,
          coachingSpecialties,
          targetAudience,
          testimonialPhotos,
          coachingStyle,
          preferredFormat,
          clientCapacity,
          availability,
          rate,
          rateType,
          offerFreeIntro,
          packages,
          aiHelp,
          aiHandsOn
        };
        
        // In a real app, you'd save this data to the user's profile via an API call
        console.log('Saving coach profile data:', coachProfileData);
        
        // Clear any registration status flag (including timestamp format)
        const keys = await AsyncStorage.getAllKeys();
        const registrationKey = keys.find(key => key === 'registration_status');
        if (registrationKey) {
          await AsyncStorage.removeItem(registrationKey);
        }
        
        // Set onboarded flag explicitly to true
        await AsyncStorage.setItem('onboarded', 'true');
        
        // Save user type and mark onboarding as complete
        await completeOnboarding('coach');
        
        console.log('Coach onboarding completed');
        
        // Show verification pending message
        Alert.alert(
          'Verification Submitted',
          'Thank you for submitting your coach profile. Our team will review your application and get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Short delay to ensure storage operations complete
                setTimeout(() => {
                  // Navigate to the main app
                  router.replace('/(tabs)');
                }, 300);
              }
            }
          ]
        );
      } catch (error) {
        console.error('Error completing coach onboarding:', error);
        setErrorMessage("An unexpected error occurred. Please try again.");
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStepTitle = () => {
    switch (currentStep) {
      case 1: return "Your Name & Location";
      case 2: return "About You";
      case 3: return "Professional Photo";
      case 4: return "Credentials";
      case 5: return "Your Experience";
      case 6: return "Coaching Specialties";
      case 7: return "Target Audience";
      case 8: return "Coaching Style";
      case 9: return "Session Format";
      case 10: return "Availability";
      case 11: return "Pricing";
      case 12: return "AI Integration";
      default: return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's your full name?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoFocus
            />
            
            <Text style={[styles.question, { marginTop: 24 }]}>Where are you located?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="City, State (e.g., New York, NY)"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Tell us about yourself</Text>
            <Text style={styles.instructions}>Briefly describe your approach to coaching and experience</Text>
            <TextInput
              style={styles.textAreaInput}
              placeholder="I'm a health coach specializing in..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        );
        
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Add a professional photo</Text>
            <Text style={styles.instructions}>A professional photo helps build trust with clients</Text>
            
            <View style={styles.photoContainer}>
              {profilePhoto ? (
                <View style={styles.profilePhotoWrapper}>
                  <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                  <TouchableOpacity 
                    style={styles.changePhotoButton} 
                    onPress={() => pickImage(setProfilePhoto)}
                  >
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addPhotoButton} 
                  onPress={() => pickImage(setProfilePhoto)}
                >
                  <Ionicons name="add-circle" size={36} color="#6366F1" />
                  <Text style={styles.addPhotoText}>Upload Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
        
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Are you a certified health coach?</Text>
            
            <View style={styles.optionButtons}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  isCertified === true && styles.selectedOptionButton,
                  { marginRight: 8 }
                ]} 
                onPress={() => setIsCertified(true)}
              >
                <Text style={[
                  styles.optionButtonText,
                  isCertified === true && styles.selectedOptionButtonText
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  isCertified === false && styles.selectedOptionButton
                ]} 
                onPress={() => setIsCertified(false)}
              >
                <Text style={[
                  styles.optionButtonText,
                  isCertified === false && styles.selectedOptionButtonText
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
            
            {isCertified && (
              <View style={styles.certificationsSection}>
                <Text style={[styles.question, { marginTop: 24 }]}>List your certifications</Text>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder="E.g., NASM CPT, ACE Health Coach, etc."
                  value={certifications.join(', ')}
                  onChangeText={text => setCertifications(text.split(',').map(item => item.trim()))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => pickImage(setCertificationProof)}
                >
                  <Ionicons name="document-attach" size={24} color="#6366F1" />
                  <Text style={styles.uploadButtonText}>
                    {certificationProof ? 'Change Certificate' : 'Upload Certificate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
        
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How many years of experience do you have?</Text>
            
            <View style={styles.experienceOptions}>
              {['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'].map(exp => (
                <TouchableOpacity 
                  key={exp}
                  style={[styles.experienceOption, experience === exp && styles.selectedExperienceOption]} 
                  onPress={() => setExperience(exp)}
                >
                  <View style={styles.experienceRadio}>
                    {experience === exp && <View style={styles.experienceRadioSelected} />}
                  </View>
                  <Text style={styles.experienceText}>{exp}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What are your specialties?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Weight loss',
              'Muscle gain',
              'Energy & sleep',
              'Stress & mindset',
              'Food relationship / intuitive eating',
              'Holistic wellness',
              'Athletic performance',
              'Medical condition support'
            ].map(specialty => (
              <TouchableOpacity 
                key={specialty}
                style={[styles.option, coachingSpecialties.includes(specialty) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(coachingSpecialties, setCoachingSpecialties, specialty)}
              >
                <Text style={styles.optionText}>{specialty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Who do you work best with?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Beginners',
              'Busy professionals',
              'Moms / parents',
              'Teens',
              'Seniors',
              'Athletes',
              "Anyone who's ready to make a change"
            ].map(audience => (
              <TouchableOpacity 
                key={audience}
                style={[styles.option, targetAudience.includes(audience) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(targetAudience, setTargetAudience, audience)}
              >
                <Text style={styles.optionText}>{audience}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 8:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How would you describe your coaching style?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Supportive & empathetic',
              'No-nonsense / tough love',
              'Holistic / mind-body focused',
              'Data-driven & structured',
              'Flexible & casual',
              'Depends on the client'
            ].map(style => (
              <TouchableOpacity 
                key={style}
                style={[styles.option, coachingStyle.includes(style) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(coachingStyle, setCoachingStyle, style)}
              >
                <Text style={styles.optionText}>{style}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 9:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's your preferred coaching format?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'In-person',
              'Online (Zoom/video)',
              'Chat-based / messaging',
              'Phone calls',
              'Group coaching',
              'Open to AI-assisted coaching'
            ].map(format => (
              <TouchableOpacity 
                key={format}
                style={[styles.option, preferredFormat.includes(format) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(preferredFormat, setPreferredFormat, format)}
              >
                <Text style={styles.optionText}>{format}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 10:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How many clients are you currently open to accepting?</Text>
            
            {[
              '1-5', '6-10', '11-20', 'Open / flexible'
            ].map(capacity => (
              <TouchableOpacity 
                key={capacity}
                style={[styles.option, clientCapacity === capacity && styles.selectedOption]} 
                onPress={() => setClientCapacity(capacity)}
              >
                <Text style={styles.optionText}>{capacity}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.question, { marginTop: 20 }]}>What days/times are you typically available?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Mornings', 'Afternoons', 'Evenings', 'Weekends', 'Flexible'
            ].map(time => (
              <TouchableOpacity 
                key={time}
                style={[styles.option, availability.includes(time) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(availability, setAvailability, time)}
              >
                <Text style={styles.optionText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 11:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What is your typical coaching rate?</Text>
            
            <View style={styles.rateInputContainer}>
              <TextInput
                style={styles.rateInput}
                placeholder="50"
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
              />
              
              <View style={styles.rateTypeOptions}>
                <TouchableOpacity 
                  style={[styles.rateTypeOption, rateType === 'session' && styles.selectedOption]} 
                  onPress={() => setRateType('session')}
                >
                  <Text style={styles.optionText}>Per session</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.rateTypeOption, rateType === 'month' && styles.selectedOption]} 
                  onPress={() => setRateType('month')}
                >
                  <Text style={styles.optionText}>Per month</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.question, { marginTop: 20 }]}>Optional offers:</Text>
            
            <TouchableOpacity 
              style={[styles.option, offerFreeIntro && styles.selectedOption]} 
              onPress={() => setOfferFreeIntro(!offerFreeIntro)}
            >
              <Text style={styles.optionText}>Offer a free intro call</Text>
            </TouchableOpacity>
            
            <Text style={[styles.question, { marginTop: 20 }]}>Add a package (Optional)</Text>
            <Text style={styles.subtext}>E.g., "3-month transformation plan"</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Describe your package offer"
              value={packages}
              onChangeText={setPackages}
              multiline
            />
          </View>
        );
      
      case 12:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Would you like your AI assistant to help with:</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Daily check-ins with clients',
              'Progress tracking summaries',
              'Recommending meals or workouts',
              'Personalized motivation prompts',
              'Collecting client questions between sessions'
            ].map(feature => (
              <TouchableOpacity 
                key={feature}
                style={[styles.option, aiHelp.includes(feature) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(aiHelp, setAiHelp, feature)}
              >
                <Text style={styles.optionText}>{feature}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.question, { marginTop: 20 }]}>How hands-on do you want your AI assistant to be?</Text>
            
            <TouchableOpacity 
              style={[styles.option, aiHandsOn === 'light' && styles.selectedOption]} 
              onPress={() => setAiHandsOn('light')}
            >
              <Text style={styles.optionText}>Light — just check-ins and reminders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, aiHandsOn === 'moderate' && styles.selectedOption]} 
              onPress={() => setAiHandsOn('moderate')}
            >
              <Text style={styles.optionText}>Moderate — help keep clients on track</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, aiHandsOn === 'full' && styles.selectedOption]} 
              onPress={() => setAiHandsOn('full')}
            >
              <Text style={styles.optionText}>Full — help support between my live sessions</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['#5E72E4', '#7F90FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.gradientHeaderContent}>
          <TouchableOpacity onPress={handleBack} style={styles.gradientBackButton} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.gradientHeaderTitle}>Create Coach Profile</Text>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${(currentStep / 12) * 100}%` }]} />
          </View>
          <Text style={styles.stepCounter}>Step {currentStep}/12</Text>
        </View>
        
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Text style={styles.stepTitle}>{renderStepTitle()}</Text>
          
          {renderStepContent()}
        </ScrollView>
        
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.disabledButton]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 12 ? 'Submit Profile' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  gradientHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gradientBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gradientHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#EDF2F7',
    borderRadius: 3,
    marginRight: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#5E72E4',
    borderRadius: 3,
  },
  stepCounter: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1E293B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepContent: {
    marginBottom: 32,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#334155',
  },
  subtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  selectedOption: {
    borderColor: '#5E72E4',
    backgroundColor: '#EEF2FF',
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    marginBottom: 24,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profilePhotoWrapper: {
    position: 'relative',
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addPhotoButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  addPhotoText: {
    color: '#6366F1',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  selectedOptionButton: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  certificationsSection: {
    marginTop: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  uploadButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  experienceOptions: {
    marginTop: 12,
    marginBottom: 24,
  },
  experienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedExperienceOption: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  experienceRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  experienceText: {
    fontSize: 16,
    color: '#334155',
  },
  rateInputContainer: {
    marginBottom: 24,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  rateTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateTypeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 6,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
}); 