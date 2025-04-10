import { supabase } from '../lib/supabase';

// Types for Twilio integrations
export interface PhoneVerificationRequest {
  phoneNumber: string;
  channel?: 'sms' | 'call';
}

export interface PhoneVerificationCheck {
  phoneNumber: string;
  code: string;
}

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  verified?: boolean;
}

/**
 * Send a verification code to the user's phone number
 */
export const sendVerificationCode = async (
  data: PhoneVerificationRequest
): Promise<PhoneVerificationResult> => {
  try {
    const { phoneNumber, channel = 'sms' } = data;
    
    // Call server endpoint to send verification code
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        channel
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to send verification code'
      };
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: 'Verification code sent successfully',
      ...result
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification code'
    };
  }
};

/**
 * Check a verification code submitted by the user
 */
export const checkVerificationCode = async (
  data: PhoneVerificationCheck
): Promise<PhoneVerificationResult> => {
  try {
    const { phoneNumber, code } = data;
    
    // Call server endpoint to check verification code
    const response = await fetch('/api/check-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        code
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to verify code'
      };
    }
    
    const result = await response.json();
    
    // Update user profile if verification successful
    if (result.verified) {
      try {
        const { user } = await supabase.auth.getUser();
        
        if (user) {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              phone_verified: true,
              phone: phoneNumber,
              updated_at: new Date()
            });
        }
      } catch (err) {
        console.error('Error updating profile:', err);
      }
    }
    
    return {
      success: true,
      verified: result.verified,
      message: result.verified ? 'Phone number verified successfully' : 'Invalid verification code'
    };
  } catch (error) {
    console.error('Error checking verification code:', error);
    return {
      success: false,
      verified: false,
      message: error instanceof Error ? error.message : 'Failed to verify code'
    };
  }
};

/**
 * Update a user's phone number and verification status
 */
export const updateUserPhone = async (
  userId: string,
  phoneNumber: string,
  verified: boolean = false
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone: phoneNumber,
        phone_verified: verified,
        updated_at: new Date()
      });
    
    if (error) {
      console.error('Error updating user phone:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update user phone:', error);
    return false;
  }
};

/**
 * Check if a phone number is already in use
 */
export const checkPhoneInUse = async (phoneNumber: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .eq('phone_verified', true)
      .limit(1);
    
    if (error) {
      console.error('Error checking phone number:', error);
      throw error;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Failed to check phone number:', error);
    return false;
  }
};

/**
 * Get the phone verification status for a user
 */
export const getPhoneVerificationStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('phone_verified')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting verification status:', error);
      return false;
    }
    
    return data?.phone_verified || false;
  } catch (error) {
    console.error('Failed to get verification status:', error);
    return false;
  }
}; 