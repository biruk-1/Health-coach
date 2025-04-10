const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const csvParser = require('csv-parser');
const crypto = require('crypto');

// Get Supabase credentials from environment variables or .env file
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mask key for security in logs
const maskedKey = supabaseKey.substring(0, 3) + '***' + supabaseKey.substring(supabaseKey.length - 4);
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', maskedKey);

// CSV file path - first argument or default
const csvFilePath = process.argv[2] || 'data/health-coaches.csv';
console.log('CSV file path:', csvFilePath);

// Function to generate a UUID
function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// Test connection to Supabase
async function testConnection() {
  try {
    const { data, error } = await supabase.from('health_coaches').select('id').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}

// Import data from CSV to Supabase
async function importData() {
  if (!(await testConnection())) {
    console.error('Error processing CSV file: Connection to Supabase failed');
    return;
  }
  
  const results = [];
  const batchSize = 100; // Number of records to insert at once
  
  try {
    // Parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Parsed ${results.length} records from CSV file`);
    
    // Process the data - clean up fields and convert types
    const processedData = results.map(record => ({
      // Use existing id or generate a UUID
      id: record.id || generateUUID(),
      name: record.name || 'Unknown',
      bio: record.bio || null,
      specialty: record.specialty?.toLowerCase() || null,
      price: record.price ? parseFloat(record.price) : null,
      rating: record.rating ? parseFloat(record.rating) : null,
      reviews_count: record.reviews_count ? parseInt(record.reviews_count) : 0,
      is_verified: record.is_verified === 'true' || record.is_verified === true,
      is_online: record.is_online === 'true' || record.is_online === true,
      years_experience: record.years_experience ? parseInt(record.years_experience) : null,
      avatar_url: record.avatar_url || record.imageUrl || null,
      address: record.address || null,
      phone: record.phone || null,
      website: record.website || null,
      location: record.location || null,
    }));
    
    // Insert data in batches
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      console.log(`Inserting batch ${batchNum} (${batch.length} records)...`);
      
      const { data, error } = await supabase
        .from('health_coaches')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error importing batch ${batchNum}:`, error);
      } else {
        console.log(`Successfully imported batch ${batchNum}`);
      }
    }
    
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Error processing CSV file:', error);
  }
}

// Run the import
importData(); 