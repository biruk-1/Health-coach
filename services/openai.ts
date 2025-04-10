// OpenAI API integration service
import AsyncStorage from '@react-native-async-storage/async-storage';

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