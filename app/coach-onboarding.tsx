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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../context/OnboardingContext';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function CoachOnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const insets = useSafeAreaInsets();

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

    if (currentStep < 7) {
      // Validate current step
      let canProceed = true;
      
      // Validation logic for each step
      switch (currentStep) {
        case 1:
          canProceed = !!fullName && !!location && !!bio;
          break;
        case 2:
          canProceed = isCertified !== null && !!experience;
          break;
        // Add other validations as needed
      }
      
      if (canProceed) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      // Submit onboarding data
      try {
        setLoading(true);
        
        // In a real implementation, you would save all data to an API
        // api.coaches.updateProfile({ ... });
        
        // Complete onboarding and specify coach type
        await completeOnboarding('coach');
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStepTitle = () => {
    switch (currentStep) {
      case 1: return "Personal Info & Bio";
      case 2: return "Credentials & Experience";
      case 3: return "Your Coaching Focus";
      case 4: return "Coaching Style";
      case 5: return "Availability";
      case 6: return "Pricing & Offers";
      case 7: return "AI Integration Preferences";
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
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
            />
            
            <Text style={[styles.question, { marginTop: 20 }]}>What's your gender? (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Optional"
              value={gender}
              onChangeText={setGender}
            />
            
            <Text style={[styles.question, { marginTop: 20 }]}>What city & state are you based in?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="New York, NY"
              value={location}
              onChangeText={setLocation}
            />
            
            <Text style={[styles.question, { marginTop: 20 }]}>Upload a profile photo</Text>
            <TouchableOpacity 
              style={styles.imageUpload}
              onPress={() => pickImage(setProfilePhoto)}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={24} color="#666" />
                  <Text style={styles.uploadText}>Tap to select a photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={[styles.question, { marginTop: 20 }]}>Write a short bio (150-300 characters)</Text>
            <Text style={styles.subtext}>Share who you are, who you help, and your coaching style.</Text>
            <TextInput
              style={[styles.textInput, { height: 100 }]}
              placeholder="I'm a certified health coach specializing in weight management and nutrition..."
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={300}
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Are you a certified health coach?</Text>
            
            <View style={styles.rowOptions}>
              <TouchableOpacity 
                style={[styles.rowOption, isCertified === true && styles.selectedOption]} 
                onPress={() => setIsCertified(true)}
              >
                <Text style={styles.optionText}>Yes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.rowOption, isCertified === false && styles.selectedOption]} 
                onPress={() => setIsCertified(false)}
              >
                <Text style={styles.optionText}>No</Text>
              </TouchableOpacity>
            </View>
            
            {isCertified && (
              <>
                <Text style={[styles.question, { marginTop: 20 }]}>Select certifications</Text>
                <Text style={styles.subtext}>Select all that apply</Text>
                
                {[
                  'NASM', 'ACE', 'Precision Nutrition', 'ACSM',
                  'ISSA', 'NSCA', 'IIN', 'Other'
                ].map(cert => (
                  <TouchableOpacity 
                    key={cert}
                    style={[styles.option, certifications.includes(cert) && styles.selectedOption]} 
                    onPress={() => toggleArrayItem(certifications, setCertifications, cert)}
                  >
                    <Text style={styles.optionText}>{cert}</Text>
                  </TouchableOpacity>
                ))}
                
                <Text style={[styles.question, { marginTop: 20 }]}>Upload or verify your certification</Text>
                <TouchableOpacity 
                  style={styles.imageUpload}
                  onPress={() => pickImage(setCertificationProof)}
                >
                  {certificationProof ? (
                    <Image source={{ uri: certificationProof }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="document-outline" size={24} color="#666" />
                      <Text style={styles.uploadText}>Tap to upload a photo or PDF</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            <Text style={[styles.question, { marginTop: 20 }]}>How many years of coaching experience do you have?</Text>
            
            {[
              '0-1 years', '2-4 years', '5-10 years', '10+ years'
            ].map(exp => (
              <TouchableOpacity 
                key={exp}
                style={[styles.option, experience === exp && styles.selectedOption]} 
                onPress={() => setExperience(exp)}
              >
                <Text style={styles.optionText}>{exp}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.question, { marginTop: 20 }]}>Do you have experience with any of the following?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Nutrition coaching',
              'Fitness coaching',
              'Habit change / accountability',
              'Mental health support',
              'Medical conditions (e.g., diabetes, PCOS)',
              'Postpartum coaching',
              'Youth or family wellness',
              'Other'
            ].map(specialty => (
              <TouchableOpacity 
                key={specialty}
                style={[styles.option, specialties.includes(specialty) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(specialties, setSpecialties, specialty)}
              >
                <Text style={styles.optionText}>{specialty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 3:
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
            
            <Text style={[styles.question, { marginTop: 20 }]}>Who do you work best with?</Text>
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
            
            <Text style={[styles.question, { marginTop: 20 }]}>Upload client testimonials or before/after photos (with consent)</Text>
            <Text style={styles.subtext}>Optional</Text>
            
            <TouchableOpacity 
              style={styles.imageUpload}
              onPress={pickMultipleImages}
            >
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="images-outline" size={24} color="#666" />
                <Text style={styles.uploadText}>Tap to select photos</Text>
              </View>
            </TouchableOpacity>
            
            {testimonialPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {testimonialPhotos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.gridImage} />
                ))}
              </View>
            )}
          </View>
        );
      
      case 4:
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
            
            <Text style={[styles.question, { marginTop: 20 }]}>What's your preferred coaching format?</Text>
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
      
      case 5:
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
      
      case 6:
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
      
      case 7:
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#5E72E4', '#7F90FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity onPress={handleBack} style={styles.gradientBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.gradientHeaderTitle}>Create Coach Profile</Text>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { width: `${(currentStep / 7) * 100}%` }]} />
          </View>
          <Text style={styles.stepIndicator}>{currentStep}/7</Text>
        </View>
        
        <Text style={styles.stepTitle}>{renderStepTitle()}</Text>
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: Math.max(insets.bottom + 140, 180) }
          ]} 
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep < 7 ? 'Continue' : 'Complete'}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 120 : 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progress: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginRight: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#5E72E4',
    borderRadius: 3,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stepContent: {
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  option: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    borderColor: '#5E72E4',
    backgroundColor: '#EDF2FF',
  },
  optionText: {
    fontSize: 16,
  },
  rowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  imageUpload: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 150,
    marginBottom: 10,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    color: '#666',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#666',
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  gridImage: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 4,
  },
  rateInputContainer: {
    marginBottom: 10,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  rateTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 