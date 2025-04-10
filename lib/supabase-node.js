require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client for Node.js environment
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = { supabase };