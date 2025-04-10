// export-coaches.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Get these values from your Supabase dashboard
const supabaseUrl = 'https://wtszbjtbfctwgnprzows.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0c3pianRiZmN0d2ducHJ6b3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDc3NDYsImV4cCI6MjA1NjE4Mzc0Nn0.igEZ9IUTNl_SCS6xFOZb7tTHtcZRPoyebD8HizvOI0o'

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCoaches() {
  try {
    console.log("Exporting coaches from Supabase...");
    // Get all health coaches
    const { data, error } = await supabase
      .from('health_coaches')
      .select('*');
    
    if (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
    
    console.log(`Retrieved ${data.length} coaches from Supabase`);
    
    // Write to a JSON file
    fs.writeFileSync('coaches.json', JSON.stringify(data, null, 2));
    console.log(`Exported ${data.length} coaches to coaches.json`);
  } catch (error) {
    console.error('Export error:', error);
  }
}

exportCoaches();