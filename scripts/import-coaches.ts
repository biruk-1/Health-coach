import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

console.log('Starting health-coach.csv import script...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', (supabaseServiceKey || supabaseAnonKey) ? '***' + (supabaseServiceKey || supabaseAnonKey).slice(-4) : 'missing');

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Use service role key if available, otherwise use anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Also, let's attempt authenticating as an admin to bypass RLS if needed
if (!supabaseServiceKey) {
  console.warn('Warning: Using anon key without service role key - might encounter RLS restrictions.');
  console.warn('Consider adding SUPABASE_SERVICE_KEY to your environment variables.');
}

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('health_coaches').select('count').single();
    if (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
}

interface CoachData {
  id?: string;
  name: string;
  bio: string;
  specialty: string;
  price: number;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  is_online: boolean;
  years_experience: number;
  avatar_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  location?: string;
}

async function clearExistingData() {
  try {
    console.log('Clearing existing data from health_coaches table...');
    
    // Delete all existing records
    const { error } = await supabase
      .from('health_coaches')
      .delete()
      .not('id', 'is', null);
    
    if (error) {
      console.error('Error clearing existing data:', error);
      return false;
    }
    
    console.log('Successfully cleared existing data');
    return true;
  } catch (error) {
    console.error('Failed to clear existing data:', error);
    return false;
  }
}

async function importCoaches(csvFilePath: string) {
  try {
    // Test connection first
    if (!await testConnection()) {
      console.error('Cannot proceed without a working Supabase connection');
      return;
    }

    // Clear existing data
    await clearExistingData();

    console.log('Reading CSV file from:', path.resolve(csvFilePath));
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error('CSV file not found:', csvFilePath);
      return;
    }

    // Read file stats
    const stats = fs.statSync(csvFilePath);
    console.log(`CSV file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Read and parse CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    console.log('File content length:', fileContent.length, 'characters');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_error: true
    });

    console.log(`Found ${records.length} records in health-coach.csv file`);
    if (records.length > 0) {
      console.log('Available fields in CSV:', Object.keys(records[0]).join(', '));
      console.log('Sample record:', JSON.stringify(records[0], null, 2));
    }

    const coaches: CoachData[] = records.map((record: any, index: number) => {
      // Generate a proper UUID for Supabase
      const id = uuidv4();
      
      // Extract name from NAME field
      const name = record.NAME || `Health Coach ${index + 1}`;
      
      // Extract location from KEYWORD or ADDRESS
      const location = record.KEYWORD || record.ADDRESS || '';
      
      // Extract rating and reviews count with proper validation
      let rating = 5.0; // Default rating
      try {
        const parsedRating = parseFloat(record.RATING);
        if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
          rating = parsedRating;
        }
      } catch (e) {}
      
      let reviewsCount = 0;
      try {
        const parsedReviews = parseInt(record['NO OF RATINGS'] || '0');
        if (!isNaN(parsedReviews) && parsedReviews >= 0) {
          reviewsCount = parsedReviews;
        }
      } catch (e) {}
      
      // Extract contact information
      const address = record.ADDRESS || '';
      const phone = record['PHONE NUMBER'] || '';
      const website = record.WEBSITE || '';
      
      // Extract and validate photo URL
      const avatarUrl = record['LINK TO PHOTO'] || 
                       'https://randomuser.me/api/portraits/men/' + (index % 70 + 1) + '.jpg';
      
      // Determine specialty based on keyword
      let specialty = 'wellness';
      if (record.KEYWORD && typeof record.KEYWORD === 'string') {
        const keyword = record.KEYWORD.toLowerCase();
        if (keyword.includes('nutrition') || keyword.includes('diet') || keyword.includes('food')) {
          specialty = 'nutrition';
        } else if (keyword.includes('fitness') || keyword.includes('gym') || keyword.includes('exercise')) {
          specialty = 'fitness';
        } else if (keyword.includes('mental') || keyword.includes('therapy') || keyword.includes('counseling')) {
          specialty = 'mental';
        } else if (keyword.includes('sleep')) {
          specialty = 'sleep';
        }
      }
      
      // Generate a bio from available information
      const bio = `${name} is a health coach specialized in ${specialty}${location ? ` based in ${location}` : ''}. Offering personalized coaching services${website ? ` with more information at ${website}` : ''}.`;
      
      // Set reasonable default values for required fields
      const price = specialty === 'mental' ? 150 : specialty === 'nutrition' ? 120 : 100;
      const isVerified = true;
      const isOnline = true;
      const yearsExperience = 5;

      return {
        id,
        name,
        bio,
        specialty,
        price,
        rating,
        reviews_count: reviewsCount,
        is_verified: isVerified,
        is_online: isOnline,
        years_experience: yearsExperience,
        avatar_url: avatarUrl,
        address,
        phone,
        website,
        location
      };
    });

    console.log(`Processed ${coaches.length} coaches from health-coach.csv for import`);
    
    // Use smaller batch size for more reliable imports
    const batchSize = 10; // Reduced batch size for more reliable imports
    const totalBatches = Math.ceil(coaches.length / batchSize);
    console.log(`Will import in ${totalBatches} batches of ${batchSize} coaches each`);

    let successCount = 0;
    let failedBatches = [];

    // Check database schema first
    console.log('Checking database schema for health_coaches table...');
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('health_coaches')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error checking schema:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('Database schema columns:', Object.keys(sampleData[0]).join(', '));
      } else {
        console.log('No existing data in health_coaches table');
      }
    } catch (schemaError) {
      console.error('Failed to check schema:', schemaError);
    }

    // Main import loop
    for (let i = 0; i < coaches.length; i += batchSize) {
      const batch = coaches.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Importing batch ${batchNumber}/${totalBatches} (${batch.length} coaches)...`);
      
      // Remove any fields that might not be in the database schema
      const cleanBatch = batch.map(coach => {
        // Ensure only properties that exist in the database are included
        const { id, name, bio, specialty, price, rating, reviews_count, 
                is_verified, is_online, years_experience, avatar_url, 
                address, phone, website, location } = coach;
        
        return { 
          id, name, bio, specialty, price, rating, reviews_count, 
          is_verified, is_online, years_experience, avatar_url, 
          address, phone, website, location 
        };
      });
      
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      
      while (!success && retryCount < maxRetries) {
        try {
          // Use upsert to handle both inserts and updates
          const { data, error } = await supabase
            .from('health_coaches')
            .upsert(cleanBatch)
            .select('id');

          if (error) {
            console.error(`Error importing batch ${batchNumber} (attempt ${retryCount + 1}):`, error);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              failedBatches.push({ batchNumber, error: error.message, startIndex: i });
              console.warn(`Failed to import batch ${batchNumber} after ${maxRetries} attempts`);
            } else {
              console.log(`Retrying batch ${batchNumber} (attempt ${retryCount + 1})...`);
              // Wait a bit longer between retries
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          } else {
            successCount += (data?.length || 0);
            console.log(`Successfully imported batch ${batchNumber} (${data?.length || 0} coaches)`);
            success = true;
          }
        } catch (batchError) {
          console.error(`Exception in batch ${batchNumber} (attempt ${retryCount + 1}):`, batchError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            failedBatches.push({ batchNumber, error: String(batchError), startIndex: i });
            console.warn(`Failed to import batch ${batchNumber} after ${maxRetries} attempts due to exception`);
          } else {
            console.log(`Retrying batch ${batchNumber} after exception (attempt ${retryCount + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      // Short delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Progress update every 10 batches
      if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
        console.log(`Progress: ${batchNumber}/${totalBatches} batches (${Math.round(batchNumber/totalBatches*100)}%)`);
        console.log(`Successfully imported ${successCount} coaches so far`);
        console.log(`Failed batches: ${failedBatches.length}`);
      }
    }

    // Verify the final count to ensure all data was imported
    const { data: countData, error: countError } = await supabase
      .from('health_coaches')
      .select('count');
      
    if (countError) {
      console.error('Error getting final count:', countError);
    } else {
      const finalCount = countData?.[0]?.count || 0;
      console.log(`Final check: ${finalCount} coaches in Supabase`);
      
      if (finalCount < coaches.length) {
        console.warn(`Warning: Only ${finalCount} of ${coaches.length} coaches were imported`);
      } else {
        console.log(`All ${coaches.length} coaches from health-coach.csv successfully imported!`);
      }
    }
    
    console.log('Import completed - health-coach.csv data is now available in Supabase');
  } catch (error) {
    console.error('Error processing health-coach.csv file:', error);
  }
}

// Use the health-coach.csv file by default
const csvFilePath = process.argv[2] || 'data/health-coach.csv';
console.log('CSV file path:', csvFilePath);

importCoaches(csvFilePath)
  .then(() => console.log('Import script finished'))
  .catch(error => console.error('Import script failed:', error)); 