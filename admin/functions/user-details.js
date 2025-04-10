// This is a serverless function for Netlify
// It handles fetching user details from Supabase

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Get user ID from query parameters
    const userId = event.queryStringParameters.id;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
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
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    // Get psychic details if user is a psychic
    let psychicDetails = null;
    if (user.role === 'psychic') {
      const { data: psychic, error: psychicError } = await supabase
        .from('psychics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!psychicError) {
        psychicDetails = psychic;
      }
    }
    
    // Get user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        psychic_id,
        psychics (
          id,
          specialties,
          rating,
          total_reviews,
          profile_image,
          user_id
        )
      `)
      .eq('user_id', userId);
    
    // For each favorite, get the psychic's user details
    const favoritesWithNames = [];
    if (!favoritesError && favorites) {
      for (const favorite of favorites) {
        if (favorite.psychics && favorite.psychics.user_id) {
          const { data: psychicUser, error: psychicUserError } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', favorite.psychics.user_id)
            .single();
          
          if (!psychicUserError) {
            favoritesWithNames.push({
              ...favorite,
              psychics: {
                ...favorite.psychics,
                users: { full_name: psychicUser.full_name }
              }
            });
          } else {
            favoritesWithNames.push(favorite);
          }
        } else {
          favoritesWithNames.push(favorite);
        }
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        user,
        psychicDetails,
        favorites: favoritesWithNames
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};