// OpenAI API integration service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomHealthCoachesForSpecialty, searchHealthCoachesFromCSV } from './health-coach-data';

// Define types for API responses
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  id: string;
  choices: {
    message: OpenAIMessage;
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionStream {
  id: string;
  choices: {
    delta: Partial<OpenAIMessage>;
    index: number;
    finish_reason: string | null;
  }[];
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Cache key for storing conversation history
const CONVERSATION_CACHE_KEY = 'openai_conversation_history';

/**
 * Get the OpenAI API key from environment variables
 */
export const getApiKey = (): string => {
  return OPENAI_API_KEY;
};

/**
 * Generate a chat completion using the OpenAI API
 */
export const generateChatCompletion = async (
  messages: OpenAIMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<ChatCompletion> => {
  try {
    const { model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000 } = options;
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }
    
    const data = await response.json();
    return data as ChatCompletion;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

/**
 * Generate a streaming chat completion using the OpenAI API
 */
export const generateStreamingChatCompletion = async (
  messages: OpenAIMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    onMessage: (content: string) => void;
    onComplete: (fullContent: string) => void;
    onError: (error: Error) => void;
  }
): Promise<void> => {
  try {
    const { 
      model = 'gpt-3.5-turbo', 
      temperature = 0.7, 
      max_tokens = 1000,
      onMessage,
      onComplete,
      onError
    } = options;
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    
    if (!reader) {
      throw new Error('Failed to get response reader');
    }
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.includes('[DONE]')) {
          continue;
        }
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            if (data === '[DONE]') continue;
            
            const parsed = JSON.parse(data) as ChatCompletionStream;
            const content = parsed.choices[0]?.delta?.content || '';
            
            if (content) {
              fullContent += content;
              onMessage(content);
            }
          } catch (err) {
            console.warn('Failed to parse chunk:', data, err);
          }
        }
      }
    }
    
    onComplete(fullContent);
  } catch (error) {
    console.error('OpenAI streaming API error:', error);
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
};

/**
 * Save conversation history to AsyncStorage
 */
export const saveConversationHistory = async (
  userId: string,
  messages: OpenAIMessage[]
): Promise<void> => {
  try {
    const key = `${CONVERSATION_CACHE_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save conversation history:', error);
  }
};

/**
 * Load conversation history from AsyncStorage
 */
export const loadConversationHistory = async (
  userId: string
): Promise<OpenAIMessage[]> => {
  try {
    const key = `${CONVERSATION_CACHE_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return [];
    }
    
    return JSON.parse(data) as OpenAIMessage[];
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }
};

/**
 * Clear conversation history from AsyncStorage
 */
export const clearConversationHistory = async (
  userId: string
): Promise<void> => {
  try {
    const key = `${CONVERSATION_CACHE_KEY}_${userId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear conversation history:', error);
  }
};

interface HealthCoachingResponse {
  mainResponse: string;
  spotlight?: string[];
  actions?: string[];
}

/**
 * Generate a health coaching response based on user query and real coach data
 */
export const generateHealthCoachingResponse = async (query: string): Promise<HealthCoachingResponse> => {
  try {
    // Determine what type of health coaching the user is looking for
    let specialty = 'all';
    if (query.toLowerCase().includes('nutrition') || query.toLowerCase().includes('diet') || 
        query.toLowerCase().includes('eat') || query.toLowerCase().includes('food')) {
      specialty = 'nutrition';
    } else if (query.toLowerCase().includes('fitness') || query.toLowerCase().includes('workout') || 
               query.toLowerCase().includes('exercise') || query.toLowerCase().includes('training')) {
      specialty = 'fitness';
    } else if (query.toLowerCase().includes('mental') || query.toLowerCase().includes('stress') || 
               query.toLowerCase().includes('anxiety') || query.toLowerCase().includes('depression')) {
      specialty = 'mental';
    } else if (query.toLowerCase().includes('sleep')) {
      specialty = 'sleep';
    } else if (query.toLowerCase().includes('wellness') || query.toLowerCase().includes('holistic')) {
      specialty = 'wellness';
    }

    // Get health coaches based on specialty
    const coaches = await getRandomHealthCoachesForSpecialty(specialty, 3);

    // Build prompt with coach information
    let prompt = `You are an AI health coach assistant. Generate a helpful, personalized response to this health question: "${query}".`;
    
    if (coaches.length > 0) {
      prompt += `\n\nIncorporate advice and information from these real health coaches in your response:`;
      coaches.forEach((coach, i) => {
        prompt += `\n${i+1}. ${coach.name} - ${coach.specialty} specialist${coach.location ? ` from ${coach.location}` : ''} with ${coach.years_experience} years of experience. Rating: ${coach.rating}/5.0 (${coach.reviews_count} reviews).`;
      });
      prompt += `\n\nMention at least one of these coaches by name in your response and attribute specific advice to them.`;
    }
    
    prompt += `\n\nAlso provide:
1. Three key spotlight points summarizing important information.
2. Three concrete action steps the user can take.`;

    // Call OpenAI
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a knowledgeable health coaching assistant that provides accurate, evidence-based health advice. You occasionally mention real health coaches and their expertise. Your responses are structured with a main response followed by spotlight points and action steps.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const completion = await generateChatCompletion(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    });

    const responseContent = completion.choices[0]?.message.content || '';
    
    // Parse the response to extract the main response, spotlight, and actions
    let mainResponse = responseContent;
    const spotlight: string[] = [];
    const actions: string[] = [];
    
    // Check for spotlight section
    const spotlightMatch = responseContent.match(/Spotlight:([\s\S]*?)(?=Action Steps:|$)/i);
    if (spotlightMatch && spotlightMatch[1]) {
      const spotlightContent = spotlightMatch[1].trim();
      const spotlightPoints = spotlightContent.split(/\n\s*[\d*\-•]+\s*/).filter(Boolean);
      spotlight.push(...spotlightPoints.map(p => p.trim()));
      
      // Remove spotlight section from main response
      mainResponse = mainResponse.replace(/Spotlight:[\s\S]*?(?=Action Steps:|$)/i, '');
    }
    
    // Check for action steps section
    const actionsMatch = responseContent.match(/Action Steps:([\s\S]*?)$/i);
    if (actionsMatch && actionsMatch[1]) {
      const actionsContent = actionsMatch[1].trim();
      const actionPoints = actionsContent.split(/\n\s*[\d*\-•]+\s*/).filter(Boolean);
      actions.push(...actionPoints.map(a => a.trim()));
      
      // Remove actions section from main response
      mainResponse = mainResponse.replace(/Action Steps:[\s\S]*?$/i, '');
    }
    
    // If we couldn't parse the format correctly, use default approach
    if (spotlight.length === 0) {
      // Create default spotlight points
      spotlight.push(
        'Consult with health professionals for personalized advice',
        'Consistency is key for achieving health goals',
        'Small changes lead to sustainable results'
      );
    }
    
    if (actions.length === 0) {
      // Create default action steps
      actions.push(
        'Start with small, manageable health changes',
        'Track your progress and adjust as needed',
        'Connect with a health coach for personalized guidance'
      );
    }
    
    // Clean up the main response
    mainResponse = mainResponse.trim();
    
    return {
      mainResponse,
      spotlight,
      actions
    };
  } catch (error) {
    console.error('Health coaching response generation error:', error);
    throw error;
  }
};

export const generateAstrologicalResponse = generateHealthCoachingResponse; 