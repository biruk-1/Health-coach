import { supabase } from '../lib/supabase';
import { HealthCoach, HealthCoachSearchParams } from '../types';

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

interface UserProfileUpdate {
  birthDate?: Date;
  height?: string;
  interests?: string[];
}

class Api {
  users = {
    /**
     * Update user profile information
     */
    updateProfile: async (profileData: UserProfileUpdate): Promise<ApiResponse<any>> => {
      try {
        const { user } = await supabase.auth.getUser();
        
        if (!user) {
          return {
            data: null,
            error: new Error('User not authenticated')
          };
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            birth_date: profileData.birthDate,
            height: profileData.height,
            interests: profileData.interests,
            updated_at: new Date()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error updating user profile:', error);
          return {
            data: null,
            error: new Error(error.message)
          };
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('Failed to update profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },
    
    /**
     * Get user profile information
     */
    getProfile: async (): Promise<ApiResponse<any>> => {
      try {
        const { user } = await supabase.auth.getUser();
        
        if (!user) {
          return {
            data: null,
            error: new Error('User not authenticated')
          };
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
          console.error('Error getting user profile:', error);
          return {
            data: null,
            error: new Error(error.message)
          };
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('Failed to get profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    }
  };
  
  // Add other API endpoints as needed
  coaches = {
    updateProfile: async (profileData: any): Promise<ApiResponse<any>> => {
      try {
        const { user } = await supabase.auth.getUser();
        
        if (!user) {
          return {
            data: null,
            error: new Error('User not authenticated')
          };
        }
        
        const { data, error } = await supabase
          .from('coach_profiles')
          .upsert({
            id: user.id,
            ...profileData,
            updated_at: new Date()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error updating coach profile:', error);
          return {
            data: null,
            error: new Error(error.message)
          };
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('Failed to update coach profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    }
  };
}

export const api = new Api();

// Digital Ocean API endpoint
const API_BASE_URL = 'http://165.232.150.178:3000/api';

/**
 * Fetches health coaches from the Digital Ocean API
 */
export const getHealthCoaches = async (params: HealthCoachSearchParams = {}) => {
  try {
    console.log('Fetching health coaches from Digital Ocean API:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.specialty) queryParams.append('specialty', params.specialty);
    if (params.rating) queryParams.append('rating', params.rating.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit || params.pageSize) {
      queryParams.append('limit', (params.limit || params.pageSize || 20).toString());
    }
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    
    console.log(`Digital Ocean API request: ${API_BASE_URL}/health-coaches?${queryParams}`);
    
    const response = await fetch(`${API_BASE_URL}/health-coaches?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Digital Ocean API returned ${data.coaches?.length || 0} coaches`);
    
    return {
      coaches: data.coaches || [],
      total: data.total || 0,
      page: data.page || params.page || 1,
      pageSize: data.pageSize || params.pageSize || 20,
      totalPages: data.totalPages || 0
    };
  } catch (error) {
    console.error('Failed to fetch health coaches from Digital Ocean:', error);
    throw error;
  }
};

/**
 * Fetches a single health coach by ID from Digital Ocean API
 */
export const getCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    console.log(`Fetching coach with ID ${id} from Digital Ocean API`);
    
    const response = await fetch(`${API_BASE_URL}/health-coaches/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Coach with ID ${id} not found`);
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const coach = await response.json();
    console.log(`Successfully fetched coach details for ${coach.name}`);
    
    return coach;
  } catch (error) {
    console.error('Failed to fetch coach by ID:', error);
    return null;
  }
}; 