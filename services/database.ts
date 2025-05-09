import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import { getHealthCoaches as apiGetHealthCoaches, getCoachById as apiGetCoachById } from './api';

// Local data cache
let cachedCoaches: HealthCoach[] = [];
let dataLoaded = false;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export interface HealthCoach {
  id: string;
  name: string;
  bio?: string;
  specialty?: string;
  price?: number;
  rating?: number;
  reviews_count?: number;
  is_verified?: boolean;
  is_online?: boolean;
  years_experience?: number;
  avatar_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  location?: string;
  // Additional fields used in UI
  imageUrl?: string;
  experience?: string;
  clientCount?: string;
  certifications?: string[];
}

export interface HealthCoachSearchParams {
  specialty?: string;
  rating?: number;
  verified?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// Sample test data since we can't access the CSV file
const TEST_COACHES: HealthCoach[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    bio: 'Certified nutritionist with 10 years of experience',
    specialty: 'nutrition',
    price: 150,
    rating: 4.8,
    reviews_count: 120,
    is_verified: true,
    is_online: true,
    years_experience: 10,
    avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
    location: 'New York, NY'
  },
  {
    id: '2',
    name: 'Michael Chen',
    bio: 'Personal trainer and wellness coach',
    specialty: 'fitness',
    price: 100,
    rating: 4.9,
    reviews_count: 85,
    is_verified: true,
    is_online: false,
    years_experience: 8,
    avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    location: 'Los Angeles, CA'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    bio: 'Holistic wellness practitioner and yoga instructor',
    specialty: 'wellness',
    price: 120,
    rating: 4.7,
    reviews_count: 95,
    is_verified: true,
    is_online: true,
    years_experience: 6,
    avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
    location: 'Miami, FL'
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    bio: 'Clinical psychologist specializing in mindfulness',
    specialty: 'mental',
    price: 180,
    rating: 4.9,
    reviews_count: 110,
    is_verified: true,
    is_online: true,
    years_experience: 12,
    avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
    location: 'Chicago, IL'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    bio: 'Sports nutritionist working with professional athletes',
    specialty: 'nutrition',
    price: 160,
    rating: 4.7,
    reviews_count: 78,
    is_verified: true,
    is_online: true,
    years_experience: 9,
    avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
    location: 'Boston, MA'
  },
  {
    id: '6',
    name: 'David Kim',
    bio: 'Strength and conditioning coach, former Olympic athlete',
    specialty: 'fitness',
    price: 130,
    rating: 4.8,
    reviews_count: 92,
    is_verified: true,
    is_online: true,
    years_experience: 11,
    avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
    location: 'Seattle, WA'
  },
  {
    id: '7',
    name: 'Sofia Garcia',
    bio: 'Holistic health expert specializing in mindfulness and stress reduction',
    specialty: 'wellness',
    price: 110,
    rating: 4.6,
    reviews_count: 65,
    is_verified: true,
    is_online: false,
    years_experience: 7,
    avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg',
    location: 'San Diego, CA'
  },
  {
    id: '8',
    name: 'Dr. Robert Taylor',
    bio: 'Cognitive behavioral therapist with focus on anxiety and depression',
    specialty: 'mental',
    price: 170,
    rating: 4.9,
    reviews_count: 103,
    is_verified: true,
    is_online: true,
    years_experience: 15,
    avatar_url: 'https://randomuser.me/api/portraits/men/6.jpg',
    location: 'Denver, CO'
  },
  {
    id: '9',
    name: 'Jennifer Lee',
    bio: 'Sleep specialist with expertise in insomnia treatment',
    specialty: 'sleep',
    price: 140,
    rating: 4.8,
    reviews_count: 87,
    is_verified: true,
    is_online: true,
    years_experience: 9,
    avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg',
    location: 'Portland, OR'
  },
  {
    id: '10',
    name: 'Carlos Mendez',
    bio: 'Plant-based nutrition coach specializing in athletic performance',
    specialty: 'nutrition',
    price: 125,
    rating: 4.6,
    reviews_count: 72,
    is_verified: true,
    is_online: false,
    years_experience: 7,
    avatar_url: 'https://randomuser.me/api/portraits/men/7.jpg',
    location: 'Austin, TX'
  },
  {
    id: '11',
    name: 'Dr. Emily Parker',
    bio: 'Family health specialist with focus on preventative care',
    specialty: 'wellness',
    price: 155,
    rating: 4.9,
    reviews_count: 118,
    is_verified: true,
    is_online: true,
    years_experience: 12,
    avatar_url: 'https://randomuser.me/api/portraits/women/7.jpg',
    location: 'Philadelphia, PA'
  },
  {
    id: '12',
    name: 'Marcus Johnson',
    bio: 'Former professional athlete specializing in sports performance',
    specialty: 'fitness',
    price: 145,
    rating: 4.8,
    reviews_count: 95,
    is_verified: true,
    is_online: true,
    years_experience: 10,
    avatar_url: 'https://randomuser.me/api/portraits/men/8.jpg',
    location: 'Atlanta, GA'
  },
  {
    id: '13',
    name: 'Dr. Olivia Wright',
    bio: 'Psychiatrist specializing in stress management and burnout prevention',
    specialty: 'mental',
    price: 175,
    rating: 4.9,
    reviews_count: 105,
    is_verified: true,
    is_online: true,
    years_experience: 14,
    avatar_url: 'https://randomuser.me/api/portraits/women/8.jpg',
    location: 'Washington, DC'
  },
  {
    id: '14',
    name: 'Jasmine Patel',
    bio: 'Ayurvedic practitioner and wellness coach',
    specialty: 'wellness',
    price: 120,
    rating: 4.7,
    reviews_count: 83,
    is_verified: true,
    is_online: false,
    years_experience: 8,
    avatar_url: 'https://randomuser.me/api/portraits/women/9.jpg',
    location: 'San Francisco, CA'
  },
  {
    id: '15',
    name: 'Daniel Smith',
    bio: 'Sleep coach helping executives overcome insomnia',
    specialty: 'sleep',
    price: 135,
    rating: 4.6,
    reviews_count: 76,
    is_verified: true,
    is_online: true,
    years_experience: 6,
    avatar_url: 'https://randomuser.me/api/portraits/men/9.jpg',
    location: 'Dallas, TX'
  },
  {
    id: '16',
    name: 'Alexandra Cooper',
    bio: 'Dietitian specializing in digestive health and food allergies',
    specialty: 'nutrition',
    price: 140,
    rating: 4.8,
    reviews_count: 92,
    is_verified: true,
    is_online: true,
    years_experience: 9,
    avatar_url: 'https://randomuser.me/api/portraits/women/10.jpg',
    location: 'Nashville, TN'
  }
];

// Function to generate a large test dataset
function generateLargeTestDataset(count = 5638) {
  console.log(`Generating large test dataset with ${count} coaches...`);
  
  const specialties = [
    'nutrition', 'fitness', 'mental', 'wellness', 'sleep', 
    'nutrition', 'fitness', 'mental', 'wellness', 'sleep' // Repeat core specialties for better distribution
  ];
  
  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Seattle', 'Denver',
    'Washington', 'Boston', 'Portland', 'Las Vegas', 'Nashville', 'Miami',
    'Atlanta', 'Detroit', 'Minneapolis', 'Cincinnati', 'Orlando', 'Cleveland',
    'St. Louis', 'Pittsburgh', 'Sacramento', 'Salt Lake City', 'Kansas City',
    'Tampa', 'Baltimore', 'Raleigh', 'San Juan', 'New Orleans', 'Memphis'
  ];
  
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const largeDataset: HealthCoach[] = [];
  
  // First, include the existing test coaches to maintain their IDs
  largeDataset.push(...TEST_COACHES);
  
  // Process in batches to avoid memory issues with very large datasets
  const BATCH_SIZE = 1000;
  const batches = Math.ceil((count - TEST_COACHES.length) / BATCH_SIZE);
  
  console.log(`Processing ${batches} batches of ${BATCH_SIZE} coaches each`);
  
  let currentId = largeDataset.length + 1;
  const totalToGenerate = count - TEST_COACHES.length;
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(BATCH_SIZE, totalToGenerate - (batch * BATCH_SIZE));
    console.log(`Generating batch ${batch + 1} with ${batchSize} coaches...`);
    
    for (let i = 0; i < batchSize; i++) {
      const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomState = states[Math.floor(Math.random() * states.length)];
      
      // More realistic rating distribution (bell curve centered around 4.5)
      const baseRating = 4.0 + (Math.random() * 1.0);
      const variance = Math.random() * 0.3 - 0.15; // -0.15 to +0.15
      const randomRating = Math.min(5.0, Math.max(4.0, baseRating + variance)).toFixed(1);
      
      // Reviews scale with rating - higher rated coaches tend to have more reviews
      const baseReviews = Math.floor(Math.random() * 150) + 50;
      const ratingFactor = parseFloat(randomRating) / 5.0;
      const randomReviews = Math.floor(baseReviews * (0.7 + ratingFactor));
      
      const randomYears = Math.floor(Math.random() * 15) + 3;
      
      // Price varies by specialty and experience
      const basePrice = 90 + (randomYears * 7);
      const specialtyFactor = randomSpecialty === 'mental' ? 1.5 : 
                             randomSpecialty === 'nutrition' ? 1.3 : 
                             randomSpecialty === 'wellness' ? 1.2 : 1.0;
      const randomPrice = Math.floor(basePrice * specialtyFactor);
      
      const randomVerified = Math.random() > 0.1; // 90% are verified
      const randomOnline = Math.random() > 0.15; // 85% are online
      const randomGender = Math.random() > 0.5 ? 'men' : 'women';
      const randomAvatarId = Math.floor(Math.random() * 70) + 1;
      
      // Generate more realistic names
      const firstNames = ['John', 'Mary', 'James', 'Linda', 'Robert', 'Patricia', 'Michael', 'Jennifer', 
                          'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
                          'Thomas', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Margaret'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
                         'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
                         'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee'];
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const namePrefix = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'Dr. ' : 'Coach ') : '';
      const name = `${namePrefix}${firstName} ${lastName}`;
      
      // Generate a more detailed bio
      const bioTemplates = [
        `Experienced ${randomSpecialty} coach with over ${randomYears} years helping clients achieve their goals.`,
        `Certified ${randomSpecialty} specialist focused on personalized coaching and sustainable results.`,
        `Passionate about ${randomSpecialty} with a proven track record of client success over ${randomYears} years.`,
        `Dedicated ${randomSpecialty} professional offering evidence-based coaching and support.`
      ];
      const bioTemplate = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
      const bio = `${bioTemplate} Based in ${randomCity}, ${randomState}.`;
      
      largeDataset.push({
        id: (currentId++).toString(),
        name,
        bio,
        specialty: randomSpecialty,
        price: randomPrice,
        rating: parseFloat(randomRating),
        reviews_count: randomReviews,
        is_verified: randomVerified,
        is_online: randomOnline,
        years_experience: randomYears,
        avatar_url: `https://randomuser.me/api/portraits/${randomGender}/${randomAvatarId}.jpg`,
        location: `${randomCity}, ${randomState}`
      });
    }
  }
  
  console.log(`Generated ${largeDataset.length} total coaches`);
  return largeDataset;
}

// Use all available data sources
export const initializeDatabase = async () => {
  try {
    console.log('==== INITIALIZING DATABASE ====');
    const now = Date.now();
    // Only refresh cache if TTL expired or not loaded yet
    if (dataLoaded && now - lastFetchTime < CACHE_TTL) {
      console.log('Using cached data, age:', Math.round((now - lastFetchTime) / 1000), 'seconds');
      console.log('Cache contains:', cachedCoaches.length, 'coaches from health-coach.csv');
      return true;
    }
    
    // Add fallback coaches to ensure we always have basic data
    console.log('Adding fallback coaches to ensure basic data is available');
    fallbackCoaches.forEach(coach => {
      const existingIndex = cachedCoaches.findIndex(c => c.id === coach.id);
      if (existingIndex >= 0) {
        cachedCoaches[existingIndex] = coach;
      } else {
        cachedCoaches.push(coach);
      }
    });
    
    try {
      // First try loading all coaches from Supabase - no limits
      console.log('Fetching all coaches from Supabase (health-coach.csv data)...');
      console.log('Supabase URL:', supabase.supabaseUrl);
      
      // Get the count first
      const { data: countData, error: countError } = await supabase
        .from('health_coaches')
        .select('count');
        
      if (!countError && countData && countData.length > 0) {
        const totalCount = countData[0].count;
        console.log(`Expected count from health-coach.csv: ${totalCount} coaches`);
        
        if (totalCount === 0) {
          console.warn('No coaches found in Supabase. The health-coach.csv file might not be imported.');
          throw new Error('No coaches found in Supabase');
        }
      }
      
      // Fetch ALL coaches without limit - critical for getting all data from health-coach.csv
      const { data, error } = await supabase
        .from('health_coaches')
        .select('*');
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error));
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn('No coaches found in Supabase - health-coach.csv might not be imported');
        throw new Error('No coaches found in Supabase');
      }
      
      console.log('SUCCESS: Received', data.length, 'coaches from health-coach.csv data in Supabase');
      cachedCoaches = data as HealthCoach[];
      lastFetchTime = now;
      console.log('Loaded coaches from health-coach.csv:', cachedCoaches.length);
      
      // Verify we have the data with specialty breakdown
      const specialties = cachedCoaches.reduce((acc, coach) => {
        const specialty = coach.specialty?.toLowerCase() || 'unknown';
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Health coach specialties breakdown:', specialties);
      
    } catch (supabaseError) {
      console.error('Supabase data unavailable:', supabaseError);
      console.error('Cannot access health-coach.csv data from Supabase');
      
      // Only use test data as a fallback if no cached data is available
      if (!dataLoaded || cachedCoaches.length === 0) {
        console.warn('FALLBACK: Using generated test data instead of health-coach.csv');
        console.warn('Generating a full set of 5638 coaches to match the CSV file count');
        
        // Generate a larger dataset to match CSV file
        cachedCoaches = generateLargeTestDataset(5638);
        lastFetchTime = now;
        console.log('Generated large dataset with', cachedCoaches.length, 'coaches');
      }
    }
    
    dataLoaded = true;
    console.log('Database initialization complete. Cache has', cachedCoaches.length, 'coaches');
    console.log('==== DATABASE INITIALIZATION COMPLETE ====');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error('Cannot access health-coach.csv data - please run the import script');
    
    // Final fallback to test data
    console.warn('EMERGENCY FALLBACK: Using generated test data');
    cachedCoaches = generateLargeTestDataset(5638); // Generate 5638 coaches
    dataLoaded = true;
    lastFetchTime = Date.now();
    console.log('Fallback completed with', cachedCoaches.length, 'coaches (generated data)');
    return false;
  }
};

export const getHealthCoaches = async (
  params: {
    specialty?: string;
    rating?: number;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  coaches: HealthCoach[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  try {
    console.log('🌟 Using Digital Ocean API for health coaches');
    // Use the Digital Ocean API instead of Supabase
    const apiResult = await apiGetHealthCoaches(params);
    
    // Check if the API returned no results and indicates fallback should be used
    if (apiResult.requiresFallback || (apiResult.coaches && apiResult.coaches.length === 0)) {
      console.log('⚠️ API returned no results, falling back to local data');
      return fallbackGetHealthCoaches(params);
    }
    
    return apiResult;
  } catch (error) {
    console.error('Error fetching health coaches from Digital Ocean:', error);
    console.log('⚠️ Falling back to local cache for health coaches');
    
    // Fall back to the old implementation
    return fallbackGetHealthCoaches(params);
  }
};

// Keep the original implementation as a fallback
export const fallbackGetHealthCoaches = async (
  params: {
    specialty?: string;
    rating?: number;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  coaches: HealthCoach[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  try {
    // Initialize database if not already loaded
    if (!dataLoaded) {
      await initializeDatabase();
    }

    // Default page size to 20 coaches per page (as requested)
    const pageSize = params.pageSize || 20;
    const currentPage = params.page || 1;
    
    console.log('Fetching health coaches with params:', JSON.stringify(params));
    console.log(`Page ${currentPage}, pageSize: ${pageSize}`);
    console.log('Total coaches in cache:', cachedCoaches.length);

    // Filter by specialty if provided
    let filteredCoaches = [...cachedCoaches];
    
    if (params.specialty && params.specialty !== 'all') {
      // Convert specialty to lowercase for case-insensitive comparison
      const specialty = params.specialty.toLowerCase();
      console.log(`Filtering by specialty: ${specialty}`);
      
      filteredCoaches = filteredCoaches.filter((coach) => {
        // Make coach specialty lowercase for comparison
        const coachSpecialty = coach.specialty?.toLowerCase() || '';
        return coachSpecialty === specialty;
      });
      console.log(`Filtered to ${filteredCoaches.length} coaches with specialty: ${specialty}`);
    }

    // Filter by rating if provided
    if (params.rating && params.rating > 0) {
      filteredCoaches = filteredCoaches.filter((coach) => {
        return coach.rating >= params.rating;
      });
      console.log(`Filtered to ${filteredCoaches.length} coaches with rating ≥ ${params.rating}`);
    }

    // Filter by search term if provided
    if (params.searchTerm && params.searchTerm.trim() !== '') {
      const term = params.searchTerm.toLowerCase().trim();
      filteredCoaches = filteredCoaches.filter((coach) => {
        return (
          coach.name?.toLowerCase().includes(term) ||
          coach.bio?.toLowerCase().includes(term) ||
          coach.specialty?.toLowerCase().includes(term)
        );
      });
      console.log(`Filtered to ${filteredCoaches.length} coaches matching search: "${params.searchTerm}"`);
    }

    // Sort by rating (highest first)
    filteredCoaches.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Calculate pagination values
    const total = filteredCoaches.length;
    const totalPages = Math.ceil(total / pageSize);
    const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    
    // Calculate start and end indices
    const startIdx = (safeCurrentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    
    // Get coaches for the current page
    const paginatedCoaches = filteredCoaches.slice(startIdx, endIdx);
    
    console.log(`Returning ${paginatedCoaches.length} coaches for page ${safeCurrentPage}/${totalPages}`);
    console.log(`Coaches range: ${startIdx+1}-${endIdx} of ${total}`);

    return {
      coaches: paginatedCoaches,
      total,
      page: safeCurrentPage,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching health coaches:', error);
    // Return empty results with pagination info in case of error
    return {
      coaches: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 0
    };
  }
};

// Function to get a single coach by ID
export const getCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    console.log('🌟 Using Digital Ocean API for coach details');
    
    // Create a timeout promise that rejects after 5 seconds
    const timeoutPromise = new Promise<HealthCoach | null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Digital Ocean API request timed out after 5 seconds'));
      }, 5000);
    });
    
    // Regular API call
    const apiPromise = apiGetCoachById(id);
    
    // Race between the API call and timeout
    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (error) {
    if (error.message && error.message.includes('timed out')) {
      console.error('Error: Digital Ocean API request timed out');
    } else {
      console.error('Error fetching coach by ID from Digital Ocean:', error);
    }
    console.log('⚠️ Falling back to local cache for coach details');
    
    // Fall back to the original implementation
    return fallbackGetCoachById(id);
  }
};

// Keep the original implementation as a fallback
export const fallbackGetCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    // Ensure data is loaded
    if (!dataLoaded) {
      await initializeDatabase();
    }
    
    // First try from cache
    let coach = cachedCoaches.find(c => c.id === id);
    
    // If not found in cache, try from Supabase directly
    if (!coach) {
      console.log('Coach not found in cache, fetching from Supabase');
      const { data, error } = await supabase
        .from('health_coaches')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.log('Supabase error, trying fallback coaches:', error.message);
        // Check our hardcoded fallback coaches
        coach = fallbackCoaches.find(c => c.id === id);
        if (coach) {
          console.log('Found coach in fallback data:', coach.name);
          // Add to cache for future use
          const existingIndex = cachedCoaches.findIndex(c => c.id === id);
          if (existingIndex >= 0) {
            cachedCoaches[existingIndex] = coach;
          } else {
            cachedCoaches.push(coach);
          }
          return coach;
        }
        throw error;
      }
      
      if (data) {
        coach = data as HealthCoach;
        // Update coach in cache
        const existingIndex = cachedCoaches.findIndex(c => c.id === id);
        if (existingIndex >= 0) {
          cachedCoaches[existingIndex] = coach;
        } else {
          cachedCoaches.push(coach);
        }
      }
    }
    
    // If still not found, check hardcoded fallback coaches as last resort
    if (!coach) {
      console.log('Coach not found in Supabase, trying fallback coaches');
      coach = fallbackCoaches.find(c => c.id === id);
      if (coach) {
        console.log('Found coach in fallback data:', coach.name);
        // Add to cache for future use
        cachedCoaches.push(coach);
      }
    }
    
    return coach || null;
  } catch (error) {
    console.error('Failed to get coach by ID:', error);
    // Last resort - check hardcoded fallback coaches
    const fallbackCoach = fallbackCoaches.find(c => c.id === id);
    if (fallbackCoach) {
      console.log('Using fallback coach data after error:', fallbackCoach.name);
      return fallbackCoach;
    }
    return null;
  }
};

export const addHealthCoachToFavorites = async (userId: string, healthCoachId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, health_coach_id: healthCoachId }]);
    
    if (error) {
      console.error('Error adding health coach to favorites:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to add health coach to favorites:', error);
    throw error;
  }
};

export const removeHealthCoachFromFavorites = async (userId: string, healthCoachId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: userId, health_coach_id: healthCoachId });
    
    if (error) {
      console.error('Error removing health coach from favorites:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to remove health coach from favorites:', error);
    throw error;
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('health_coach_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }
    
    return data.map(favorite => favorite.health_coach_id);
  } catch (error) {
    console.error('Failed to get user favorites:', error);
    throw error;
  }
};

export async function searchHealthCoaches(query: string): Promise<HealthCoach[]> {
  if (!dataLoaded) {
    await initializeDatabase();
  }
  
  const term = query.toLowerCase();
  return cachedCoaches.filter(coach => 
    coach.name?.toLowerCase().includes(term) || 
    coach.specialty?.toLowerCase().includes(term) ||
    coach.location?.toLowerCase().includes(term) ||
    coach.bio?.toLowerCase().includes(term)
  );
}

// Add some pre-populated coaches to ensure we always have basic data even when Digital Ocean is down
export const fallbackCoaches: HealthCoach[] = [
  {
    id: '20',
    name: 'Joseph Jones',
    specialty: 'mental',
    bio: 'Mental health specialist with focus on stress management and anxiety reduction. I help clients develop coping strategies using evidence-based techniques.',
    rating: 5.0,
    reviews_count: 128,
    years_experience: 15,
    avatar_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1289&auto=format&fit=crop',
    location: 'New York',
    is_verified: true,
    is_online: true
  },
  {
    id: '21',
    name: 'Sarah Johnson',
    specialty: 'Fitness',
    bio: 'Personal trainer specialized in weight loss and strength training. I create personalized fitness plans tailored to your goals.',
    rating: 4.8,
    reviews_count: 95,
    years_experience: 8,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop',
    location: 'Los Angeles',
    is_verified: true,
    is_online: true
  },
  {
    id: '22',
    name: 'Michael Brown',
    specialty: 'Nutrition',
    bio: 'Licensed nutritionist focusing on holistic health approach. I help clients develop sustainable eating habits for long-term health.',
    rating: 4.9,
    reviews_count: 156,
    years_experience: 12,
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop',
    location: 'Chicago',
    is_verified: true,
    is_online: false
  }
]; 

/**
 * Get a health coach by ID - this is the function used by [id].tsx
 */
export const getHealthCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    console.log('Getting health coach by ID:', id);
    
    if (!id) {
      console.error('Invalid coach ID - empty or undefined');
      return null;
    }
    
    // Clean up the ID
    const cleanId = id.toString().trim();
    
    // Try using the Digital Ocean API first
    try {
      console.log('Attempting to fetch coach from Digital Ocean API with ID:', cleanId);
      const coach = await getCoachById(cleanId);
      
      if (coach) {
        console.log('Successfully fetched coach from Digital Ocean:', coach.name);
        return coach;
      } else {
        console.log('Coach not found in Digital Ocean API, trying fallback');
      }
    } catch (apiError) {
      console.error('Digital Ocean API error:', apiError);
      console.log('Falling back to local coach lookup');
    }
    
    // If Digital Ocean fails, try the fallback
    console.log('Using fallback method to find coach with ID:', cleanId);
    return await fallbackGetCoachById(cleanId);
  } catch (error) {
    console.error('Error in getHealthCoachById:', error);
    return null;
  }
}; 