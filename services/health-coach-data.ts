import * as FileSystem from 'expo-file-system';
import * as Asset from 'expo-asset';
import { Platform } from 'react-native';
import { HealthCoach } from './database';

// In-memory cache for health coach data
let healthCoachesCache: HealthCoach[] = [];
let isDataLoaded = false;

/**
 * Copy the health-coach.csv file from assets to FileSystem.documentDirectory
 */
export const copyHealthCoachCSVToFileSystem = async (): Promise<string> => {
  try {
    const csvPath = FileSystem.documentDirectory + 'health-coach.csv';
    const csvExists = await FileSystem.getInfoAsync(csvPath);
    
    if (csvExists.exists) {
      console.log('Health coach CSV already exists at:', csvPath);
      return csvPath;
    }
    
    // Since the CSV file might not be in assets, we'll use a fallback approach
    // First, try to create it from the data in the database.ts file
    console.log('Creating health coach CSV file from test data...');
    
    // Get the test data from the database.ts file (TEST_COACHES)
    // and create a CSV representation
    const csvContent = "Location,Google Maps URL,Name,Address,Phone,Website,Rating,Reviews,Avatar URL\n" + 
      "New York NY,https://maps.google.com,Dr. Sarah Johnson,,1-555-123-4567,https://example.com,4.8,120,https://randomuser.me/api/portraits/women/1.jpg\n" +
      "Los Angeles CA,https://maps.google.com,Michael Chen,,1-555-987-6543,https://example.com,4.9,85,https://randomuser.me/api/portraits/men/1.jpg\n" +
      "Miami FL,https://maps.google.com,Emma Rodriguez,,1-555-456-7890,https://example.com,4.7,95,https://randomuser.me/api/portraits/women/2.jpg\n" +
      "Chicago IL,https://maps.google.com,Dr. James Wilson,,1-555-789-0123,https://example.com,4.9,110,https://randomuser.me/api/portraits/men/2.jpg\n" +
      "Boston MA,https://maps.google.com,Lisa Thompson,,1-555-234-5678,https://example.com,4.7,78,https://randomuser.me/api/portraits/women/3.jpg\n" +
      "Seattle WA,https://maps.google.com,David Kim,,1-555-345-6789,https://example.com,4.8,92,https://randomuser.me/api/portraits/men/4.jpg\n" +
      "San Diego CA,https://maps.google.com,Sofia Garcia,,1-555-456-7890,https://example.com,4.6,65,https://randomuser.me/api/portraits/women/5.jpg\n" +
      "Denver CO,https://maps.google.com,Dr. Robert Taylor,,1-555-567-8901,https://example.com,4.9,103,https://randomuser.me/api/portraits/men/6.jpg\n" +
      "Portland OR,https://maps.google.com,Jennifer Lee,,1-555-678-9012,https://example.com,4.8,87,https://randomuser.me/api/portraits/women/6.jpg\n" +
      "Austin TX,https://maps.google.com,Carlos Mendez,,1-555-789-0123,https://example.com,4.6,72,https://randomuser.me/api/portraits/men/7.jpg\n" +
      "Philadelphia PA,https://maps.google.com,Dr. Emily Parker,,1-555-890-1234,https://example.com,4.9,118,https://randomuser.me/api/portraits/women/7.jpg\n" +
      "Atlanta GA,https://maps.google.com,Marcus Johnson,,1-555-901-2345,https://example.com,4.8,95,https://randomuser.me/api/portraits/men/8.jpg\n";
    
    // Write the CSV content to the file
    await FileSystem.writeAsStringAsync(csvPath, csvContent);
    
    console.log('Successfully created health-coach.csv at:', csvPath);
    return csvPath;
  } catch (error) {
    console.error('Error copying health coach CSV:', error);
    throw error;
  }
};

/**
 * Parses a line from the CSV file into a HealthCoach object
 */
const parseCSVLine = (line: string): HealthCoach | null => {
  try {
    // Split by commas, but handle commas within quotes
    const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!match) return null;
    
    const fields = match.map(field => {
      // Remove leading comma and clean up quotes
      let value = field.startsWith(',') ? field.substring(1) : field;
      // Remove surrounding quotes and unescape double quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1).replace(/""/g, '"');
      }
      return value.trim();
    });
    
    if (fields.length < 8) return null;
    
    const [location, googleMapsUrl, name, address, phone, website, ratingStr, reviewsStr, avatarUrl] = fields;
    
    // Skip entries with no name
    if (!name || name === '') return null;
    
    // Extract specialty from name or default to 'health'
    let specialty = 'health';
    if (name.toLowerCase().includes('nutrition')) specialty = 'nutrition';
    else if (name.toLowerCase().includes('fitness') || name.toLowerCase().includes('personal train')) specialty = 'fitness';
    else if (name.toLowerCase().includes('mental') || name.toLowerCase().includes('therap')) specialty = 'mental';
    else if (name.toLowerCase().includes('sleep')) specialty = 'sleep';
    else if (name.toLowerCase().includes('wellness')) specialty = 'wellness';
    
    const rating = ratingStr ? parseFloat(ratingStr) : 5.0;
    const reviews_count = reviewsStr ? parseInt(reviewsStr, 10) : 0;
    
    return {
      id: Math.random().toString(36).substring(2, 15),
      name,
      specialty,
      bio: `Expert ${specialty} coach based in ${location}`,
      address,
      phone,
      website,
      location,
      rating,
      reviews_count,
      avatar_url: avatarUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
      is_verified: true,
      is_online: Math.random() > 0.3, // 70% chance of being online
      years_experience: Math.floor(Math.random() * 15) + 3 // Random experience between 3-18 years
    };
  } catch (error) {
    console.error('Error parsing CSV line:', error, line);
    return null;
  }
};

/**
 * Load health coaches from the CSV file
 */
export const loadHealthCoachesFromCSV = async (): Promise<HealthCoach[]> => {
  if (isDataLoaded && healthCoachesCache.length > 0) {
    return healthCoachesCache;
  }
  
  try {
    // Ensure CSV file is available
    await copyHealthCoachCSVToFileSystem();
    
    // Path to the CSV file
    const csvPath = FileSystem.documentDirectory + 'health-coach.csv';
    const csvExists = await FileSystem.getInfoAsync(csvPath);
    
    if (!csvExists.exists) {
      console.error('CSV file not found at:', csvPath);
      throw new Error('Health coach data file not found');
    }
    
    const csvContent = await FileSystem.readAsStringAsync(csvPath);
    const lines = csvContent.split('\n');
    
    // Skip header line if present
    const startIndex = lines[0].includes('location') || lines[0].includes('Location') ? 1 : 0;
    
    const coaches: HealthCoach[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const coach = parseCSVLine(line);
        if (coach) coaches.push(coach);
      }
    }
    
    console.log(`Loaded ${coaches.length} health coaches from CSV`);
    
    // Cache the results
    healthCoachesCache = coaches;
    isDataLoaded = true;
    
    return coaches;
  } catch (error) {
    console.error('Error loading health coaches from CSV:', error);
    return [];
  }
};

/**
 * Get a random selection of health coaches for a specific specialty
 */
export const getRandomHealthCoachesForSpecialty = async (
  specialty: string = 'all',
  count: number = 5
): Promise<HealthCoach[]> => {
  try {
    // Load coaches if not already cached
    if (!isDataLoaded || healthCoachesCache.length === 0) {
      await loadHealthCoachesFromCSV();
    }
    
    // Filter by specialty if not 'all'
    let filteredCoaches = healthCoachesCache;
    if (specialty !== 'all') {
      filteredCoaches = healthCoachesCache.filter(coach => 
        coach.specialty?.toLowerCase() === specialty.toLowerCase()
      );
    }
    
    // If we have fewer coaches than requested, return all of them
    if (filteredCoaches.length <= count) {
      return filteredCoaches;
    }
    
    // Get random selection of coaches
    const randomCoaches: HealthCoach[] = [];
    const indices = new Set<number>();
    
    while (randomCoaches.length < count && indices.size < filteredCoaches.length) {
      const randomIndex = Math.floor(Math.random() * filteredCoaches.length);
      if (!indices.has(randomIndex)) {
        indices.add(randomIndex);
        randomCoaches.push(filteredCoaches[randomIndex]);
      }
    }
    
    return randomCoaches;
  } catch (error) {
    console.error('Error getting random health coaches:', error);
    return [];
  }
};

/**
 * Get list of all unique locations from the health coaches data
 */
export const getAllCoachLocations = async (): Promise<string[]> => {
  try {
    // Load coaches if not already cached
    if (!isDataLoaded || healthCoachesCache.length === 0) {
      await loadHealthCoachesFromCSV();
    }
    
    // Extract and deduplicate locations
    const locations = new Set<string>();
    healthCoachesCache.forEach(coach => {
      if (coach.location) {
        locations.add(coach.location);
      }
    });
    
    return Array.from(locations).sort();
  } catch (error) {
    console.error('Error getting coach locations:', error);
    return [];
  }
};

/**
 * Search health coaches by name, specialty, or location
 */
export const searchHealthCoachesFromCSV = async (
  query: string
): Promise<HealthCoach[]> => {
  try {
    // Load coaches if not already cached
    if (!isDataLoaded || healthCoachesCache.length === 0) {
      await loadHealthCoachesFromCSV();
    }
    
    if (!query || query.trim() === '') {
      return healthCoachesCache.slice(0, 20); // Return first 20 if no query
    }
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return healthCoachesCache.filter(coach => {
      const nameMatch = coach.name?.toLowerCase().includes(query.toLowerCase());
      const specialtyMatch = coach.specialty?.toLowerCase().includes(query.toLowerCase());
      const locationMatch = coach.location?.toLowerCase().includes(query.toLowerCase());
      
      // Check if all search terms are found in any of the fields
      const allTermsMatch = searchTerms.every(term => {
        return (
          coach.name?.toLowerCase().includes(term) ||
          coach.specialty?.toLowerCase().includes(term) ||
          coach.location?.toLowerCase().includes(term) ||
          coach.bio?.toLowerCase().includes(term)
        );
      });
      
      return nameMatch || specialtyMatch || locationMatch || allTermsMatch;
    }).slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('Error searching health coaches:', error);
    return [];
  }
}; 