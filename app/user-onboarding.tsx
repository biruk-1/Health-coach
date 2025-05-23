import React, { useState, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserOnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Who's the coaching for?
  const [coachingFor, setCoachingFor] = useState<'myself' | 'child' | 'other' | null>(null);

  // Step 2: Primary Health Goals
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);

  // Step 3: Health Background
  const [healthConditions, setHealthConditions] = useState<string>('');
  const [workingWithDoctor, setWorkingWithDoctor] = useState<'yes' | 'no' | 'not_sure' | null>(null);

  // Step 4: Biggest Challenges
  const [biggestChallenge, setBiggestChallenge] = useState<string | null>(null);
  const [otherChallenge, setOtherChallenge] = useState<string>('');

  // Step 5: Lifestyle & Routine
  const [typicalDay, setTypicalDay] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<'very_active' | 'somewhat_active' | 'mostly_sedentary' | 'just_starting' | null>(null);

  // Step 6: Coaching Format Preferences
  const [coachingTypes, setCoachingTypes] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [supportFrequency, setSupportFrequency] = useState<'daily' | 'few_times_week' | 'weekly' | 'occasional' | null>(null);

  // Step 7: Tracking & Accountability
  const [trackingItems, setTrackingItems] = useState<string[]>([]);
  const [wantsReminders, setWantsReminders] = useState<'yes' | 'no' | 'not_sure' | null>(null);

  // Step 8: Coaching Style & AI Tone
  const [communicationStyle, setCommunicationStyle] = useState<'supportive' | 'straightforward' | 'chill' | 'structured' | 'mix' | null>(null);

  // Step 9: Personalization
  const [motivation, setMotivation] = useState<string>('');

  // Step 10: Budget
  const [budget, setBudget] = useState<'under_100' | '100_200' | '200_400' | '400_plus' | 'not_sure' | null>(null);

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

  const handleNext = async () => {
    if (loading) return;

    if (currentStep < 13) {
      // Validate current step
      let canProceed = true;
      
      // Simplified validation for each step
      switch (currentStep) {
        case 1:
          if (coachingFor === null) {
            setErrorMessage("Please select who this coaching is for");
            canProceed = false;
          }
          break;
        case 2:
          if (healthGoals.length === 0) {
            setErrorMessage("Please select at least one health goal");
            canProceed = false;
          }
          break;
        case 3:
          if (primaryGoal === null) {
            setErrorMessage("Please select your primary goal");
            canProceed = false;
          }
          break;
        case 4:
          if (workingWithDoctor === null) {
            setErrorMessage("Please select if you're working with a doctor");
            canProceed = false;
          }
          break;
        case 5:
          if (biggestChallenge === null) {
            setErrorMessage("Please select your biggest challenge");
            canProceed = false;
          }
          break;
        case 6:
          if (!typicalDay.trim()) {
            setErrorMessage("Please describe your typical day");
            canProceed = false;
          }
          break;
        case 7:
          if (activityLevel === null) {
            setErrorMessage("Please select your activity level");
            canProceed = false;
          }
          break;
        case 8:
          if (coachingTypes.length === 0) {
            setErrorMessage("Please select at least one coaching type");
            canProceed = false;
          }
          break;
        case 9:
          if (supportFrequency === null) {
            setErrorMessage("Please select your preferred support frequency");
            canProceed = false;
          }
          break;
        case 10:
          if (trackingItems.length === 0 || wantsReminders === null) {
            setErrorMessage("Please complete all fields");
            canProceed = false;
          }
          break;
        case 11:
          if (communicationStyle === null) {
            setErrorMessage("Please select your preferred coaching style");
            canProceed = false;
          }
          break;
        case 12:
          if (!motivation.trim()) {
            setErrorMessage("Please tell us what motivates you");
            canProceed = false;
          }
          break;
        case 13:
          if (budget === null) {
            setErrorMessage("Please select your budget");
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
        
        // Save personalization data to user profile
        // This would typically be saved to a database
        const onboardingData = {
          coachingFor,
          healthGoals,
          primaryGoal,
          healthConditions,
          workingWithDoctor,
          biggestChallenge,
          otherChallenge,
          typicalDay,
          activityLevel,
          coachingTypes,
          location,
          supportFrequency,
          trackingItems,
          wantsReminders,
          communicationStyle,
          motivation,
          budget
        };
        
        // In a real app, you'd save this data to the user's profile via an API call
        console.log('Saving user preferences:', onboardingData);
        
        // Clear any registration status flag (including timestamp format)
        const keys = await AsyncStorage.getAllKeys();
        const registrationKey = keys.find(key => key === 'registration_status');
        if (registrationKey) {
          await AsyncStorage.removeItem(registrationKey);
        }
        
        // Set onboarded flag explicitly to true
        await AsyncStorage.setItem('onboarded', 'true');
        
        // Save user type and mark onboarding as complete
        await completeOnboarding('user');
        
        console.log('User onboarding completed, redirecting to tabs');
        
        // Short delay to ensure storage operations complete
        setTimeout(() => {
        // Navigate to the main app
        router.replace('/(tabs)');
        }, 500);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setErrorMessage("An unexpected error occurred. Please try again.");
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStepTitle = () => {
    switch (currentStep) {
      case 1: return "Who is this for?";
      case 2: return "Your Health Goals";
      case 3: return "Your Primary Goal";
      case 4: return "Health Background";
      case 5: return "Your Biggest Challenge";
      case 6: return "Daily Lifestyle";
      case 7: return "Activity Level";
      case 8: return "Coaching Preferences";
      case 9: return "Support Frequency";
      case 10: return "Tracking & Accountability";
      case 11: return "Coaching Style";
      case 12: return "What Motivates You";
      case 13: return "Budget";
      default: return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Who are you seeking health coaching for?</Text>
            
            <TouchableOpacity 
              style={[styles.optionCard, coachingFor === 'myself' && styles.selectedOptionCard]} 
              onPress={() => setCoachingFor('myself')}
            >
              <Ionicons 
                name={coachingFor === 'myself' ? "checkmark-circle" : "person"} 
                size={24} 
                color={coachingFor === 'myself' ? "#6366F1" : "#64748B"} 
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, coachingFor === 'myself' && styles.selectedOptionText]}>
                Myself
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionCard, coachingFor === 'child' && styles.selectedOptionCard]} 
              onPress={() => setCoachingFor('child')}
            >
              <Ionicons 
                name={coachingFor === 'child' ? "checkmark-circle" : "people"} 
                size={24} 
                color={coachingFor === 'child' ? "#6366F1" : "#64748B"} 
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, coachingFor === 'child' && styles.selectedOptionText]}>
                My child
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionCard, coachingFor === 'other' && styles.selectedOptionCard]} 
              onPress={() => setCoachingFor('other')}
            >
              <Ionicons 
                name={coachingFor === 'other' ? "checkmark-circle" : "person-add"} 
                size={24} 
                color={coachingFor === 'other' ? "#6366F1" : "#64748B"} 
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, coachingFor === 'other' && styles.selectedOptionText]}>
                Someone else
              </Text>
            </TouchableOpacity>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What are your main health goals?</Text>
            <Text style={styles.instructions}>Select all that apply</Text>
            
            <View style={styles.optionsGrid}>
              {[
                { id: 'weight', label: 'Lose weight', icon: 'scale' },
                { id: 'muscle', label: 'Gain muscle', icon: 'barbell' },
                { id: 'nutrition', label: 'Eat healthier', icon: 'nutrition' },
                { id: 'sleep', label: 'Improve sleep', icon: 'bed' },
                { id: 'energy', label: 'Boost energy', icon: 'battery-charging' },
                { id: 'stress', label: 'Manage stress', icon: 'heart' },
                { id: 'habits', label: 'Build habits', icon: 'calendar' },
                { id: 'medical', label: 'Manage condition', icon: 'medical' },
                { id: 'wellness', label: 'Overall wellness', icon: 'flower' }
              ].map(goal => (
                <TouchableOpacity 
                  key={goal.id}
                  style={[
                    styles.gridOption, 
                    healthGoals.includes(goal.label) && styles.selectedGridOption
                  ]} 
                  onPress={() => toggleArrayItem(healthGoals, setHealthGoals, goal.label)}
                >
                  <Ionicons 
                    name={healthGoals.includes(goal.label) ? "checkmark-circle" : goal.icon} 
                    size={24} 
                    color={healthGoals.includes(goal.label) ? "#6366F1" : "#64748B"} 
                  />
                  <Text style={[
                    styles.gridOptionText,
                    healthGoals.includes(goal.label) && styles.selectedGridOptionText
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Which is your #1 priority right now?</Text>
            
            {healthGoals.length > 0 ? (
              <View style={styles.priorityOptions}>
                {healthGoals.map(goal => (
                  <TouchableOpacity 
                    key={goal}
                    style={[styles.priorityOption, primaryGoal === goal && styles.selectedPriorityOption]} 
                    onPress={() => setPrimaryGoal(goal)}
                  >
                    <View style={styles.priorityRadio}>
                      {primaryGoal === goal && <View style={styles.priorityRadioSelected} />}
                    </View>
                    <Text style={styles.priorityText}>{goal}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noOptions}>
                Please go back and select at least one health goal first.
              </Text>
            )}
          </View>
        );
        
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Do you have any health conditions or injuries?</Text>
            <Text style={styles.subtext}>Optional</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Type here..."
              value={healthConditions}
              onChangeText={setHealthConditions}
              multiline
            />
            
            <Text style={[styles.question, { marginTop: 20 }]}>Are you currently working with a doctor or healthcare provider?</Text>
            
            <TouchableOpacity 
              style={[styles.option, workingWithDoctor === 'yes' && styles.selectedOption]} 
              onPress={() => setWorkingWithDoctor('yes')}
            >
              <Text style={styles.optionText}>Yes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, workingWithDoctor === 'no' && styles.selectedOption]} 
              onPress={() => setWorkingWithDoctor('no')}
            >
              <Text style={styles.optionText}>No</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, workingWithDoctor === 'not_sure' && styles.selectedOption]} 
              onPress={() => setWorkingWithDoctor('not_sure')}
            >
              <Text style={styles.optionText}>Not sure</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's been your biggest challenge with staying healthy?</Text>
            
            {[
              'Staying consistent',
              'Not sure what to do',
              'Time constraints',
              'Motivation',
              'Cravings / emotional eating',
              'Injury or physical limitations',
              'Other'
            ].map(challenge => (
              <TouchableOpacity 
                key={challenge}
                style={[styles.option, biggestChallenge === challenge && styles.selectedOption]} 
                onPress={() => setBiggestChallenge(challenge)}
              >
                <Text style={styles.optionText}>{challenge}</Text>
              </TouchableOpacity>
            ))}
            
            {biggestChallenge === 'Other' && (
              <TextInput
                style={[styles.textInput, { marginTop: 10 }]}
                placeholder="Please specify..."
                value={otherChallenge}
                onChangeText={setOtherChallenge}
              />
            )}
          </View>
        );
      
      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What does a typical day look like for you?</Text>
            <Text style={styles.subtext}>Include wake/sleep times, meals, work, movement, etc. (Optional)</Text>
            
            <TextInput
              style={[styles.textInput, { height: 100 }]}
              placeholder="Type here..."
              value={typicalDay}
              onChangeText={setTypicalDay}
              multiline
            />
          </View>
        );
      
      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How active are you currently?</Text>
            
            <TouchableOpacity 
              style={[styles.option, activityLevel === 'very_active' && styles.selectedOption]} 
              onPress={() => setActivityLevel('very_active')}
            >
              <Text style={styles.optionText}>Very active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, activityLevel === 'somewhat_active' && styles.selectedOption]} 
              onPress={() => setActivityLevel('somewhat_active')}
            >
              <Text style={styles.optionText}>Somewhat active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, activityLevel === 'mostly_sedentary' && styles.selectedOption]} 
              onPress={() => setActivityLevel('mostly_sedentary')}
            >
              <Text style={styles.optionText}>Mostly sedentary</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, activityLevel === 'just_starting' && styles.selectedOption]} 
              onPress={() => setActivityLevel('just_starting')}
            >
              <Text style={styles.optionText}>Just starting out</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 8:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What type of coaching are you open to?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'In-person (local coach)',
              'Online/video coaching',
              'Messaging/check-in based coaching',
              'AI coaching (chat with a virtual health coach)',
              'Open to anything'
            ].map(type => (
              <TouchableOpacity 
                key={type}
                style={[styles.option, coachingTypes.includes(type) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(coachingTypes, setCoachingTypes, type)}
              >
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.question, { marginTop: 20 }]}>Where are you located?</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Enter zip code, city/state"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        );
      
      case 9:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How often would you like support?</Text>
            
            <TouchableOpacity 
              style={[styles.option, supportFrequency === 'daily' && styles.selectedOption]} 
              onPress={() => setSupportFrequency('daily')}
            >
              <Text style={styles.optionText}>Daily check-ins</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, supportFrequency === 'few_times_week' && styles.selectedOption]} 
              onPress={() => setSupportFrequency('few_times_week')}
            >
              <Text style={styles.optionText}>A few times per week</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, supportFrequency === 'weekly' && styles.selectedOption]} 
              onPress={() => setSupportFrequency('weekly')}
            >
              <Text style={styles.optionText}>Weekly</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, supportFrequency === 'occasional' && styles.selectedOption]} 
              onPress={() => setSupportFrequency('occasional')}
            >
              <Text style={styles.optionText}>Occasional guidance only</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 10:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What would you like help tracking?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            
            {[
              'Weight',
              'Water intake',
              'Food/meals',
              'Workouts',
              'Sleep',
              'Energy/mood',
              'Habits'
            ].map(item => (
              <TouchableOpacity 
                key={item}
                style={[styles.option, trackingItems.includes(item) && styles.selectedOption]} 
                onPress={() => toggleArrayItem(trackingItems, setTrackingItems, item)}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.question, { marginTop: 20 }]}>Would you like reminders or check-ins from your coach (human or AI)?</Text>
            
            <TouchableOpacity 
              style={[styles.option, wantsReminders === 'yes' && styles.selectedOption]} 
              onPress={() => setWantsReminders('yes')}
            >
              <Text style={styles.optionText}>Yes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, wantsReminders === 'no' && styles.selectedOption]} 
              onPress={() => setWantsReminders('no')}
            >
              <Text style={styles.optionText}>No</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, wantsReminders === 'not_sure' && styles.selectedOption]} 
              onPress={() => setWantsReminders('not_sure')}
            >
              <Text style={styles.optionText}>Not sure yet</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 11:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How would you like your coach (human or AI) to communicate with you?</Text>
            
            <TouchableOpacity 
              style={[styles.option, communicationStyle === 'supportive' && styles.selectedOption]} 
              onPress={() => setCommunicationStyle('supportive')}
            >
              <Text style={styles.optionText}>Supportive & encouraging</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, communicationStyle === 'straightforward' && styles.selectedOption]} 
              onPress={() => setCommunicationStyle('straightforward')}
            >
              <Text style={styles.optionText}>Straightforward & no-nonsense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, communicationStyle === 'chill' && styles.selectedOption]} 
              onPress={() => setCommunicationStyle('chill')}
            >
              <Text style={styles.optionText}>Chill & casual</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, communicationStyle === 'structured' && styles.selectedOption]} 
              onPress={() => setCommunicationStyle('structured')}
            >
              <Text style={styles.optionText}>Structured & professional</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, communicationStyle === 'mix' && styles.selectedOption]} 
              onPress={() => setCommunicationStyle('mix')}
            >
              <Text style={styles.optionText}>Mix it up</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 12:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What motivates you to improve your health right now?</Text>
            <Text style={styles.subtext}>Optional</Text>
            
            <TextInput
              style={[styles.textInput, { height: 100 }]}
              placeholder="E.g., 'I want to be a better role model for my kids' or 'I'm tired of feeling exhausted every day'"
              value={motivation}
              onChangeText={setMotivation}
              multiline
            />
          </View>
        );
      
      case 13:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's your ideal monthly budget for health coaching?</Text>
            
            <TouchableOpacity 
              style={[styles.option, budget === 'under_100' && styles.selectedOption]} 
              onPress={() => setBudget('under_100')}
            >
              <Text style={styles.optionText}>Under $100</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, budget === '100_200' && styles.selectedOption]} 
              onPress={() => setBudget('100_200')}
            >
              <Text style={styles.optionText}>$100–200</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, budget === '200_400' && styles.selectedOption]} 
              onPress={() => setBudget('200_400')}
            >
              <Text style={styles.optionText}>$200–400</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, budget === '400_plus' && styles.selectedOption]} 
              onPress={() => setBudget('400_plus')}
            >
              <Text style={styles.optionText}>$400+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, budget === 'not_sure' && styles.selectedOption]} 
              onPress={() => setBudget('not_sure')}
            >
              <Text style={styles.optionText}>Not sure yet</Text>
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
        style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Your Profile</Text>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${(currentStep / 13) * 100}%` }]} />
          </View>
          <Text style={styles.stepCounter}>Step {currentStep}/13</Text>
        </View>
        
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: Math.max(insets.bottom + 100, 120) }
          ]} 
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Text style={styles.stepTitle}>{renderStepTitle()}</Text>
          
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.disabledButton]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 13 ? 'Complete' : 'Continue'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 10,
  },
  progressBarContainer: {
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
  stepCounter: {
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
  followupSection: {
    marginTop: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    paddingHorizontal: 16,
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedOptionCard: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionIcon: {
    marginRight: 12,
  },
  selectedOptionText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridOption: {
    width: '31%',
    margin: '1%',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedGridOption: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  gridOptionText: {
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 4,
  },
  selectedGridOptionText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  priorityOptions: {
    marginTop: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedPriorityOption: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  priorityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  priorityText: {
    fontSize: 16,
    color: '#1E293B',
  },
  noOptions: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
}); 