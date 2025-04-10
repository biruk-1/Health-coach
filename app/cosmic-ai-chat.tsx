import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { generateAstrologicalResponse } from '../services/openai';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  spotlight?: string[];
  actions?: string[];
  showSummary?: boolean;
};

export default function FitnessChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, setBalance } = usePurchases();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isError, setIsError] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load balance from AsyncStorage on mount
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const storedBalance = await AsyncStorage.getItem('credits_balance');
        const currentBalance = storedBalance ? parseInt(storedBalance, 0) : 0;
        setBalance(currentBalance);
      } catch (error) {
        console.error('Error loading balance:', error);
      }
    };
    loadBalance();
  }, []);

  // Update welcome message
  useEffect(() => {
    if (isInitialLoad && balance >= 0) {
      let welcomeMessage = "Hello! I'm your personal AI fitness coach. Purchase credits to get personalized fitness guidance! (1 credit per question)";
      if (user && user.birthDate) {
        const birthDate = new Date(user.birthDate);
        welcomeMessage = `Hello${user.fullName ? ' ' + user.fullName.split(' ')[0] : ''}! I'm your personal AI fitness coach. I see you were born on ${birthDate.toLocaleDateString()}${user.birthLocation ? ' in ' + user.birthLocation : ''}. Purchase credits to get personalized fitness guidance! (1 credit per question)`;
      }
      setMessages([{
        id: '1',
        text: welcomeMessage,
        sender: 'ai',
        timestamp: new Date(),
        spotlight: ["Personal AI fitness coach at your service", "Get personalized workout and nutrition advice", "1 credit per question"],
        actions: ["Get a personalized workout plan", "Ask about nutrition advice", "Get form correction tips"],
        showSummary: false,
      }]);
      setIsInitialLoad(false);
    }
    if (balance === 0 && !isInitialLoad) {
      router.push('/fitness-subscription');
    }
  }, [balance, user, isInitialLoad]);

  // Sync balance when returning from subscription screen
  useFocusEffect(
    React.useCallback(() => {
      const syncBalance = async () => {
        try {
          const storedBalance = await AsyncStorage.getItem('credits_balance');
          const newBalance = storedBalance ? parseInt(storedBalance, 0) : 0;
          setBalance(newBalance);
          console.log('Synced balance after subscription:', newBalance);
          if (newBalance === 0 && !isInitialLoad) {
            router.push('/fitness-subscription');
          }
        } catch (error) {
          console.error('Error syncing balance:', error);
        }
      };
      syncBalance();
    }, [])
  );

  // Retry logic for errors
  useEffect(() => {
    if (isError && retryCount < 3 && messages[messages.length - 1]?.sender === 'user') {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        handleSend(messages[messages.length - 1].text);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount]);

  const handleSend = async (query?: string) => {
    if (balance === 0) {
      router.push('/fitness-subscription');
      return;
    }

    const userQuery = (query || message).trim();
    if (!userQuery || isTyping) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userQuery,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setMessage('');
    setIsTyping(true);
    setIsError(false);

    try {
      console.log('Sending query:', userQuery);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      const response = await generateAstrologicalResponse(userQuery);
      console.log('Response:', response);

      if (!response || !response.mainResponse) {
        throw new Error('Empty or invalid response from AI');
      }

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.mainResponse,
        sender: 'ai',
        timestamp: new Date(),
        spotlight: response.spotlight || [],
        actions: response.actions || [],
        showSummary: false,
      };
      setMessages(prev => [...prev, newAiMessage]);

      const newBalance = balance - 1;
      await AsyncStorage.setItem('credits_balance', newBalance.toString());
      setBalance(newBalance);
      setRetryCount(0);
      setIsError(false);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsError(true);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Oops! Something went wrong: ${error.message}. Please try again.`,
        sender: 'ai',
        timestamp: new Date(),
        spotlight: ["Error occurred", "Try again or ask differently"],
        actions: ["Retry", "Ask a new question"],
        showSummary: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Scroll to end when messages update
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const toggleSummary = (id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, showSummary: !msg.showSummary } : msg));
  };

  const handleRetry = () => {
    setIsError(false);
    setRetryCount(0);
    const lastUserMessage = messages.slice().reverse().find(msg => msg.sender === 'user');
    if (lastUserMessage) handleSend(lastUserMessage.text);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
      {item.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#ffffff" />
        </View>
      )}
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.sender === 'ai' && item.spotlight && item.actions && (
          <TouchableOpacity style={styles.summaryToggle} onPress={() => toggleSummary(item.id)}>
            <Text style={styles.summaryToggleText}>{item.showSummary ? "Hide Summary" : "Show Summary"}</Text>
            <Ionicons name={item.showSummary ? "chevron-up" : "chevron-down"} size={16} color="#6366f1" />
          </TouchableOpacity>
        )}
        {item.sender === 'ai' && item.showSummary && item.spotlight && item.actions && (
          <View style={styles.summaryContainer}>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>✨ Spotlight</Text>
              {item.spotlight.map((point, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>🔮 Actions</Text>
              {item.actions.map((action, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <Text style={styles.timestamp}>{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );

  const showBirthInfoPrompt = () => {
    if (user && !user.birthDate) {
      Alert.alert(
        "Complete Your Profile",
        "For more personalized readings, add your birth date, time, and location in settings.",
        [
          { text: "Later" },
          { text: "Go to Settings", onPress: () => router.push('/settings/account') }
        ]
      );
    } else {
      const birthInfo = [];
      if (user?.birthDate) birthInfo.push(`Birth Date: ${new Date(user.birthDate).toLocaleDateString()}`);
      if (user?.birthTime) birthInfo.push(`Birth Time: ${new Date(user.birthTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      if (user?.birthLocation) birthInfo.push(`Birth Location: ${user.birthLocation}`);
      if (birthInfo.length > 0) {
        Alert.alert("Your Birth Information", birthInfo.join('\n'), [
          { text: "OK" },
          { text: "Edit", onPress: () => router.push('/settings/account') }
        ]);
      }
    }
  };

  const renderSuggestions = () => {
    const suggestions = [
      "What's a good workout for building muscle?",
      "How can I improve my running form?",
      "What should I eat before a workout?",
      "Can you create a HIIT workout plan?",
      "What exercises help with back pain?"
    ];
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Try asking (1 credit each):</Text>
        <View style={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity key={index} style={styles.suggestionButton} onPress={() => setMessage(suggestion)}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (balance === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Cosmic AI</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={showBirthInfoPrompt}>
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        <View style={styles.creditPrompt}>
          <Text style={styles.creditPromptText}>
            You have no credits! Purchase credits to ask Cosmic AI questions.
          </Text>
          <TouchableOpacity
            style={styles.creditButton}
            onPress={() => router.push('/fitness-subscription')}
          >
            <Text style={styles.creditButtonText}>Get Credits</Text>
            <Ionicons name="wallet" size={20} color="#ffffff" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cosmic AI</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online • {balance} Credits</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.infoButton} onPress={showBirthInfoPrompt}>
          <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={messages.length === 1 ? renderSuggestions : null}
      />
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Cosmic AI is typing</Text>
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      )}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error generating response. Retrying ({retryCount}/3)...</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry Now</Text>
          </TouchableOpacity>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask Cosmic AI anything (1 credit)"
          placeholderTextColor="#94a3b8"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!message.trim() || isTyping}
        >
          <Ionicons name="send" size={20} color={message.trim() && !isTyping ? '#ffffff' : '#94a3b8'} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  backButton: { 
    padding: 8 
  },
  headerTitleContainer: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1e293b' 
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 4, 
    backgroundColor: '#10b981' 
  },
  statusText: { 
    fontSize: 12, 
    color: '#64748b' 
  },
  infoButton: { 
    padding: 8 
  },
  messagesList: { 
    padding: 16, 
    paddingBottom: 32 
  },
  messageContainer: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    maxWidth: '80%' 
  },
  userMessage: { 
    alignSelf: 'flex-end' 
  },
  aiMessage: { 
    alignSelf: 'flex-start' 
  },
  aiAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#6366f1', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 8 
  },
  messageContent: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 12, 
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  messageText: { 
    color: '#1e293b', 
    fontSize: 16, 
    lineHeight: 22 
  },
  summaryToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  summaryToggleText: { 
    color: '#6366f1', 
    fontSize: 14, 
    marginRight: 4 
  },
  summaryContainer: { 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  summarySection: { 
    marginBottom: 8 
  },
  summaryTitle: { 
    color: '#6366f1', 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  bulletPoint: { 
    flexDirection: 'row', 
    marginBottom: 2 
  },
  bulletDot: { 
    color: '#64748b', 
    marginRight: 6, 
    fontSize: 14 
  },
  bulletText: { 
    color: '#64748b', 
    fontSize: 14, 
    flex: 1 
  },
  timestamp: { 
    color: '#94a3b8', 
    fontSize: 10, 
    alignSelf: 'flex-end', 
    marginTop: 4 
  },
  typingIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8, 
    marginLeft: 16 
  },
  typingText: { 
    color: '#64748b', 
    fontSize: 14, 
    marginRight: 8 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    color: '#1e293b', 
    fontSize: 16, 
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#6366f1', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  sendButtonDisabled: { 
    backgroundColor: '#94a3b8' 
  },
  errorContainer: { 
    backgroundColor: '#fef2f2', 
    padding: 12, 
    margin: 16, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  errorText: { 
    color: '#ef4444', 
    fontSize: 14, 
    flex: 1 
  },
  retryButton: { 
    backgroundColor: '#ef4444', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 4, 
    marginLeft: 8 
  },
  retryButtonText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  suggestionsContainer: { 
    marginTop: 16, 
    marginBottom: 24 
  },
  suggestionsTitle: { 
    color: '#1e293b', 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  suggestionsList: { 
    gap: 8 
  },
  suggestionButton: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  suggestionText: { 
    color: '#64748b', 
    fontSize: 14 
  },
  creditPrompt: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32,
    backgroundColor: '#ffffff'
  },
  creditPromptText: { 
    color: '#1e293b', 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 24 
  },
  creditButton: { 
    backgroundColor: '#6366f1', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  creditButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  buttonIcon: { 
    marginLeft: 8 
  }
});