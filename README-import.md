# Importing Health Coach Data to Supabase

This guide explains how to import your CSV health coach data into your Supabase database.

## Prerequisites

1. Node.js installed on your computer
2. Access to your Supabase project
3. CSV file with health coach data
4. Supabase project URL and anon key

## Step 1: Create the Database Table

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the contents of `scripts/create-table.sql`
5. Run the query to create the table and set up permissions

## Step 2: Prepare Your CSV File

1. Make sure your CSV file has headers matching the column names in the table
2. Place your CSV file in the `data` directory (default is `data/health-coaches.csv`)

## Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Install Dependencies

Run the following command to install required packages:

```
npm install @supabase/supabase-js csv-parser dotenv
```

## Step 5: Run the Import Script

```
node scripts/import-coaches.js
```

If your CSV file is in a different location, you can specify it:

```
node scripts/import-coaches.js path/to/your/file.csv
```

## Step 6: Verify the Data

1. Go to your Supabase dashboard
2. Click on "Table Editor" in the left sidebar
3. Select the `health_coaches` table
4. Check that your data has been imported correctly

## Troubleshooting

- If you get an error about missing dependencies, make sure you've run `npm install` for the required packages
- If the script fails to connect to Supabase, check your credentials in the `.env` file
- If the import fails due to data format issues, make sure your CSV has the expected column names and formats 