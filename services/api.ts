import { supabase } from '../lib/supabase';
import { HealthCoach, HealthCoachSearchParams } from '../types';

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

interface UserProfileUpdate {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  birthTime?: Date;
  birthLocation?: string;
  height?: string;
  interests?: string[];
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'user' | 'psychic';
}

class Api {
  constructor() {
    console.log('Initializing API service');
    // Check and initialize app metadata
    this.initializeApp();
  }

  // Initialize app and check for required database structures
  private async initializeApp() {
    try {
      console.log('Using user metadata for profile storage');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  users = {
    /**
     * Update user profile information
     */
    updateProfile: async (profileData: UserProfileUpdate): Promise<ApiResponse<any>> => {
      try {
        // Track which fields were updated successfully
        const updateResults = {
          metadataUpdated: false,
          emailUpdated: false
        };
        
        // Get current session first to ensure we're authenticated
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return {
            data: null,
            error: new Error('Authentication error: ' + sessionError.message),
            success: false
          };
        }
        
        if (!sessionData?.session) {
          console.error('No active session found');
          return {
            data: null,
            error: new Error('No active session found. Please log in again.'),
            success: false
          };
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User fetch error:', userError);
          return {
            data: null,
            error: new Error('Failed to get user: ' + userError.message),
            success: false
          };
        }
        
        if (!user) {
          console.error('No user found despite valid session');
          return {
            data: null,
            error: new Error('User not authenticated'),
            success: false
          };
        }
        
        console.log('Authenticated user ID:', user.id);
        console.log('Current form data:', JSON.stringify(profileData));
        
        // Only update email if it's changed and provided
        if (profileData.email && profileData.email !== user.email) {
          console.log('Updating email from', user.email, 'to', profileData.email);
          try {
            const { error: emailUpdateError } = await supabase.auth.updateUser({
              email: profileData.email
            });
            
            if (emailUpdateError) {
              console.error('Email update error:', emailUpdateError);
              // Continue with metadata update even if email update fails
              // Email updates often require verification, so we don't want to block the whole update
            } else {
              updateResults.emailUpdated = true;
            }
          } catch (emailError) {
            console.error('Exception during email update:', emailError);
            // Continue with profile update even if email update fails
          }
        } else {
          // Email wasn't changed or not provided
          updateResults.emailUpdated = true;
        }
        
        // Skip phone number update for now as it requires SMS verification
        
        // Prepare metadata update with all fields, ensuring we don't lose existing data
        const existingMetadata = user.user_metadata || {};
        
        // Create an update object that explicitly sets each field
        // This ensures empty fields clear existing values rather than being ignored
        const metadataUpdate = {
          // Preserve fields that aren't being updated
          ...existingMetadata,
          // Always update these fields with the new values (even if empty/null)
          full_name: profileData.fullName,
          birth_date: profileData.birthDate ? profileData.birthDate.toISOString() : null,
          birth_time: profileData.birthTime ? profileData.birthTime.toISOString().substr(11, 8) : null,
          birth_location: profileData.birthLocation,
          height: profileData.height,
          interests: profileData.interests,
          updated_at: new Date().toISOString()
        };
        
        console.log('Updating user metadata to:', JSON.stringify(metadataUpdate));
        
        // Since profiles table doesn't exist, store profile data in user metadata
        try {
          // Update user metadata instead of using the profiles table
          const { data, error } = await supabase.auth.updateUser({
            data: metadataUpdate
          });
          
          if (error) {
            console.error('Error updating user metadata:', error);
            // If we've updated the email but not metadata, return partial success
            if (updateResults.emailUpdated) {
              return {
                data: {
                  id: user.id,
                  email: profileData.email || user.email,
                  partialUpdate: true,
                  metadataFailed: true
                },
                error: new Error('Email was updated but profile details failed: ' + error.message),
                success: true // Mark as success since email was updated
              };
            }
            
            return {
              data: null,
              error: new Error(error.message),
              success: false
            };
          }
          
          updateResults.metadataUpdated = true;
          console.log('Update successful! New user metadata:', JSON.stringify(data.user.user_metadata));
          
          try {
            // Refresh the session to ensure the updated data is available
            await supabase.auth.refreshSession();
          } catch (refreshError) {
            console.warn('Session refresh failed after update:', refreshError);
            // Continue anyway since the update was successful
          }
          
          // Return success with the updated user data
          return {
            data: {
              id: data.user.id,
              email: data.user.email,
              ...data.user.user_metadata,
              emailUpdated: updateResults.emailUpdated
            },
            error: null,
            success: true
          };
        } catch (metadataError) {
          console.error('Error updating user metadata:', metadataError);
          
          // If email was updated but metadata failed, return partial success
          if (updateResults.emailUpdated) {
            return {
              data: {
                id: user.id,
                email: profileData.email || user.email,
                partialUpdate: true,
                metadataFailed: true
              },
              error: new Error('Email was updated but profile details failed: ' + 
                (metadataError instanceof Error ? metadataError.message : 'Unknown error')),
              success: true // Mark as success since email was updated
            };
          }
          
          return {
            data: null,
            error: metadataError instanceof Error ? metadataError : new Error('Unknown error updating metadata'),
            success: false
          };
        }
      } catch (error) {
        console.error('Failed to update profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error'),
          success: false
        };
      }
    },
    
    /**
     * Get user profile information
     */
    getProfile: async (): Promise<ApiResponse<any>> => {
      try {
        // First check if we have an active session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error in getProfile:', sessionError);
          return {
            data: null,
            error: new Error('Authentication error: ' + sessionError.message),
            success: false
          };
        }
        
        if (!sessionData?.session) {
          console.error('No active session found in getProfile method');
          return {
            data: null,
            error: new Error('No active session found. Please log in again.'),
            success: false
          };
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user in getProfile:', userError);
          return {
            data: null,
            error: new Error(userError.message),
            success: false
          };
        }
        
        if (!user) {
          console.error('No user found despite valid session in getProfile');
          return {
            data: null,
            error: new Error('User not authenticated'),
            success: false
          };
        }
        
        // Use user metadata directly
        const userData = {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name,
          phone: user.phone || user.user_metadata?.phone,
          birthDate: user.user_metadata?.birth_date,
          birthTime: user.user_metadata?.birth_time,
          birthLocation: user.user_metadata?.birth_location,
          height: user.user_metadata?.height,
          interests: user.user_metadata?.interests,
        };
        
        return { 
          data: userData, 
          error: null,
          success: true 
        };
      } catch (error) {
        console.error('Failed to get profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error'),
          success: false
        };
      }
    }
  };
  
  auth = {
    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<{ token?: string; error?: string }> => {
      try {
        console.log('Registering user with email:', data.email);
        
        // Register user with Supabase
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              phone: data.phone,
              role: data.role || 'user'
            }
          }
        });
        
        if (error) {
          console.error('Registration error:', error.message);
          return { error: error.message };
        }
        
        if (!authData.session) {
          console.log('User registered but no session returned - email confirmation may be required');
          return { token: 'email-confirmation-required' };
        }
        
        return { token: authData.session.access_token };
      } catch (error) {
        console.error('Failed to register user:', error);
        return { 
          error: error instanceof Error ? error.message : 'An unexpected error occurred during registration'
        };
      }
    },
    
    /**
     * Get current user information
     */
    me: async (): Promise<ApiResponse<any>> => {
      try {
        // First check if we have an active session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return {
            data: null,
            error: new Error('Authentication error: ' + sessionError.message),
            success: false
          };
        }
        
        if (!sessionData?.session) {
          console.error('No active session found in me() method');
          return {
            data: null,
            error: new Error('No active session found. Please log in again.'),
            success: false
          };
        }
        
        // Try to get user data with a timeout to prevent hanging
        const userPromise = supabase.auth.getUser();
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });
        
        // Race the user request against the timeout
        const result = await Promise.race([userPromise, timeoutPromise]);
        
        // Extract user data from the result
        const { data: { user } = { user: null }, error: userError } = result as any;
        
        if (userError) {
          console.error('Error getting user:', userError);
          return {
            data: null,
            error: new Error(userError.message),
            success: false
          };
        }
        
        if (!user) {
          console.error('No user found despite valid session');
          return {
            data: null,
            error: new Error('User not found'),
            success: false
          };
        }
        
        console.log('Authenticated user in me() method:', user.id);
        
        // Extract user profile data from user metadata
        const userData = {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name,
          phone: user.phone || user.user_metadata?.phone,
          birthDate: user.user_metadata?.birth_date,
          birthTime: user.user_metadata?.birth_time,
          birthLocation: user.user_metadata?.birth_location,
          height: user.user_metadata?.height,
          interests: user.user_metadata?.interests,
        };
        
        console.log('Successfully loaded user data:', userData.email);
        
        return { 
          data: userData, 
          error: null,
          success: true
        };
      } catch (error) {
        console.error('Failed to get user profile:', error);
        
        // Check if it's a timeout error
        if (error.message === 'Request timeout') {
          return {
            data: null,
            error: new Error('Unable to retrieve user data - request timed out'),
            success: false
          };
        }
        
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error'),
          success: false
        };
      }
    }
  };
  
  // Add other API endpoints as needed
  coaches = {
    updateProfile: async (profileData: any): Promise<ApiResponse<any>> => {
      try {
        // Get current session first to ensure we're authenticated
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return {
            data: null,
            error: new Error('Authentication error: ' + sessionError.message),
            success: false
          };
        }
        
        if (!sessionData?.session) {
          console.error('No active session found');
          return {
            data: null,
            error: new Error('No active session found. Please log in again.'),
            success: false
          };
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User fetch error:', userError);
          return {
            data: null,
            error: new Error('Failed to get user: ' + userError.message),
            success: false
          };
        }
        
        if (!user) {
          console.error('No user found despite valid session');
          return {
            data: null,
            error: new Error('User not authenticated'),
            success: false
          };
        }
        
        console.log('Authenticated coach ID:', user.id);
        
        // Store coach profile data in user metadata
        const { data, error } = await supabase.auth.updateUser({
          data: {
            ...profileData,
            role: 'coach',
            updated_at: new Date().toISOString()
          }
        });
        
        if (error) {
          console.error('Error updating coach metadata:', error);
          return {
            data: null,
            error: new Error(error.message),
            success: false
          };
        }
        
        // Return success with the updated user data
        return { 
          data: {
            id: data.user.id,
            email: data.user.email,
            ...data.user.user_metadata
          }, 
          error: null,
          success: true
        };
      } catch (error) {
        console.error('Failed to update coach profile:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error'),
          success: false
        };
      }
    }
  };
}

/**
 * Initialize database tables if they don't exist
 */
const initDatabase = async () => {
  try {
    console.log('Checking if profiles table exists...');
    
    // Check if profiles table exists by attempting to select from it
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If we get a specific error about the relation not existing, create the table
    if (error && error.code === '42P01') {
      console.log('Profiles table does not exist. Creating it...');
      
      // Create profiles table using SQL (we need to use RPC for this)
      const { error: createTableError } = await supabase.rpc('create_profiles_table', {});
      
      if (createTableError) {
        console.error('Error creating profiles table:', createTableError);
        
        // Alternative approach: Use auth.users and store profile data in user metadata instead
        console.log('Using alternative approach: storing profile data in user metadata');
        return false;
      }
      
      console.log('Profiles table created successfully');
      return true;
    } else if (error) {
      console.error('Error checking profiles table:', error);
      return false;
    } else {
      console.log('Profiles table exists');
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

// Add a stored procedure to create the profiles table
const createStoredProcedure = async () => {
  try {
    // This would typically be done through Supabase dashboard or migration scripts
    // But for development purposes, we can create it here
    const { error } = await supabase.rpc('create_stored_procedure', {});
    
    if (error) {
      console.error('Error creating stored procedure:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to create stored procedure:', error);
    return false;
  }
};

// Modify the Api class to use user metadata for profile storage instead of the profiles table
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
    
    // Make sure specialty is lowercase and only added if it's defined
    if (params.specialty) {
      const specialty = params.specialty.toLowerCase();
      queryParams.append('specialty', specialty);
      console.log(`Filtering by specialty: ${specialty}`);
    }
    
    if (params.rating) queryParams.append('rating', params.rating.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit || params.pageSize) {
      queryParams.append('limit', (params.limit || params.pageSize || 20).toString());
    }
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    
    console.log(`Digital Ocean API request: ${API_BASE_URL}/health-coaches?${queryParams}`);
    
    const response = await fetch(`${API_BASE_URL}/health-coaches?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Digital Ocean API response:', {
      page: data.page, 
      pageSize: data.pageSize,
      total: data.total,
      totalPages: data.totalPages,
      coachesCount: data.coaches?.length || 0
    });
    
    return {
      coaches: data.coaches || [],
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.pageSize || 20,
      totalPages: data.totalPages || 1,
      requiresFallback: false
    };
  } catch (error) {
    console.error('Error fetching health coaches from Digital Ocean API:', error);
    return {
      coaches: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 0,
      requiresFallback: true
    };
  }
};

/**
 * Fetches a specific health coach by ID from the Digital Ocean API
 */
export const getCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    console.log('Fetching coach by ID from Digital Ocean API:', id);
    
    const response = await fetch(`${API_BASE_URL}/health-coaches/${id}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Digital Ocean API coach response:', data.id ? 'Found coach' : 'No coach found');
    
    return data as HealthCoach;
  } catch (error) {
    console.error('Error fetching coach by ID from Digital Ocean API:', error);
    return null;
  }
};

/**
 * Add a health coach to favorites in Digital Ocean API
 */
export const addFavoriteCoach = async (userId: string, coachId: string): Promise<boolean> => {
  try {
    console.log('Adding coach to favorites in Digital Ocean API:', { userId, coachId });
    
    try {
      // Attempt to make the request to the Digital Ocean API
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          coachId
        }),
      });
      
      if (!response.ok) {
        // If server returns error, log it but don't throw
        console.warn(`Favorites API returned status: ${response.status}. Falling back to local storage only.`);
        // Still return true since we're using local storage as backup
        return true;
      }
      
      const data = await response.json();
      console.log('Successfully added coach to favorites:', data);
      return true;
    } catch (apiError) {
      // Network error or other API issue - log and use fallback
      console.warn('Could not connect to favorites API, using local storage only:', apiError.message);
      // Still return true since local storage will handle it
      return true;
    }
  } catch (error) {
    console.error('Error adding coach to favorites:', error);
    return false;
  }
};

/**
 * Remove a health coach from favorites in Digital Ocean API
 */
export const removeFavoriteCoach = async (userId: string, coachId: string): Promise<boolean> => {
  try {
    console.log('Removing coach from favorites in Digital Ocean API:', { userId, coachId });
    
    try {
      // Attempt to make the request to the Digital Ocean API
      const response = await fetch(`${API_BASE_URL}/favorites/${userId}/${coachId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If server returns error, log it but don't throw
        console.warn(`Favorites API returned status: ${response.status}. Falling back to local storage only.`);
        // Still return true since we're using local storage as backup
        return true;
      }
      
      console.log('Successfully removed coach from favorites');
      return true;
    } catch (apiError) {
      // Network error or other API issue - log and use fallback
      console.warn('Could not connect to favorites API, using local storage only:', apiError.message);
      // Still return true since local storage will handle it
      return true;
    }
  } catch (error) {
    console.error('Error removing coach from favorites:', error);
    return false;
  }
};

/**
 * Get favorite coaches for a user from Digital Ocean API
 */
export const getFavoriteCoaches = async (userId: string): Promise<HealthCoach[]> => {
  try {
    console.log('Fetching favorite coaches from Digital Ocean API for user:', userId);
    
    try {
      // Attempt to make the request to the Digital Ocean API
      const response = await fetch(`${API_BASE_URL}/favorites/${userId}`);
      
      if (!response.ok) {
        // If server returns error, log it but don't throw
        console.warn(`Favorites API returned status: ${response.status}. Falling back to local storage only.`);
        // Return empty array to fallback to local storage
        return [];
      }
      
      const data = await response.json();
      console.log(`Retrieved ${data.favorites?.length || 0} favorite coaches from Digital Ocean API`);
      
      return data.favorites || [];
    } catch (apiError) {
      // Network error or other API issue - log and use fallback
      console.warn('Could not connect to favorites API, using local storage only:', apiError.message);
      // Return empty array to use local storage only
      return [];
    }
  } catch (error) {
    console.error('Error fetching favorite coaches:', error);
    return [];
  }
}; 