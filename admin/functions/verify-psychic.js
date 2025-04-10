// This is a serverless function for Netlify
// It handles verifying a psychic in Supabase

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const { psychicId, userId } = JSON.parse(event.body);
    
    if (!psychicId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Psychic ID is required' }),
      };
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase credentials not configured' }),
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update psychic verification status
    const { error } = await supabase
      .from('psychics')
      .update({ is_verified: true })
      .eq('id', psychicId);
    
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Psychic verified successfully' 
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};