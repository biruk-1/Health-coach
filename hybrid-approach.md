# Hybrid Approach: Supabase Auth + Digital Ocean for Coach Data

Since you've already logged into the SSH server, this simplified approach will:
1. Keep user authentication on Supabase
2. Move only the health coach data to Digital Ocean

## 1. Set Up PostgreSQL Database for Coach Data

```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to PostgreSQL user
sudo -i -u postgres

# Create a database and user for your app
psql
CREATE DATABASE coachdata;
CREATE USER coachuser WITH ENCRYPTED PASSWORD 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON DATABASE coachdata TO coachuser;
\q

# Exit postgres user
exit
```

## 2. Create a Simple API for Coach Data

```bash
# Install Node.js and npm
sudo apt install nodejs npm -y

# Create a directory for your API
mkdir -p /home/main/coach-api
cd /home/main/coach-api

# Initialize a new Node.js project
npm init -y

# Install required packages
npm install express pg cors dotenv
```

Create a basic API server:

```bash
nano index.js
```

Add this content:

```javascript
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'coachuser',
  host: 'localhost',
  database: 'coachdata',
  password: 'choose_a_strong_password', // Use your actual password
  port: 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Create the health_coaches table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS health_coaches (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  specialty VARCHAR(100),
  price NUMERIC,
  rating NUMERIC,
  reviews_count INTEGER,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  years_experience INTEGER,
  avatar_url TEXT,
  location VARCHAR(255)
);
`;

pool.query(createTableQuery)
  .then(() => console.log('Health coaches table created or already exists'))
  .catch(err => console.error('Error creating table:', err));

// Health coaches endpoints
app.get('/api/health-coaches', async (req, res) => {
  try {
    const { specialty, rating, page = 1, limit = 20, searchTerm } = req.query;
    
    let query = 'SELECT * FROM health_coaches';
    const queryParams = [];
    const conditions = [];
    
    if (specialty && specialty !== 'all') {
      conditions.push(`specialty = $${queryParams.length + 1}`);
      queryParams.push(specialty);
    }
    
    if (rating) {
      conditions.push(`rating >= $${queryParams.length + 1}`);
      queryParams.push(parseFloat(rating));
    }
    
    if (searchTerm) {
      conditions.push(`(name ILIKE $${queryParams.length + 1} OR bio ILIKE $${queryParams.length + 1} OR location ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${searchTerm}%`);
    }
    
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add sorting by rating (highest first)
    query += ' ORDER BY rating DESC';
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), offset);
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM health_coaches';
    if (conditions.length) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, conditions.length));
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      coaches: result.rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching health coaches:', error);
    res.status(500).json({ error: 'Failed to fetch health coaches' });
  }
});

app.get('/api/health-coaches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM health_coaches WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health coach not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching health coach:', error);
    res.status(500).json({ error: 'Failed to fetch health coach' });
  }
});

// Endpoint to import data (you'll use this to upload your CSV data)
app.post('/api/import', async (req, res) => {
  try {
    const coaches = req.body;
    
    if (!Array.isArray(coaches) || coaches.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of coaches.' });
    }
    
    // Use a transaction to ensure all-or-nothing import
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let successCount = 0;
      for (const coach of coaches) {
        const query = `
          INSERT INTO health_coaches (
            id, name, bio, specialty, price, rating, reviews_count, 
            is_verified, is_online, years_experience, avatar_url, location
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = $2, 
            bio = $3, 
            specialty = $4, 
            price = $5, 
            rating = $6, 
            reviews_count = $7, 
            is_verified = $8, 
            is_online = $9, 
            years_experience = $10, 
            avatar_url = $11, 
            location = $12
        `;
        
        await client.query(query, [
          coach.id,
          coach.name,
          coach.bio,
          coach.specialty,
          coach.price,
          coach.rating,
          coach.reviews_count,
          coach.is_verified,
          coach.is_online,
          coach.years_experience,
          coach.avatar_url,
          coach.location
        ]);
        
        successCount++;
      }
      
      await client.query('COMMIT');
      res.json({ success: true, count: successCount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error importing coaches:', error);
    res.status(500).json({ error: 'Failed to import coaches' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Coach API server running on port ${port}`);
});
```

Create a .env file for environment variables:

```bash
nano .env
```

Add:
```
PORT=3000
```

## 3. Run the API as a Service

Set up systemd service:

```bash
sudo nano /etc/systemd/system/coach-api.service
```

Add:
```
[Unit]
Description=Coach API
After=network.target

[Service]
User=main
WorkingDirectory=/home/main/coach-api
ExecStart=/usr/bin/node /home/main/coach-api/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=coach-api

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable coach-api
sudo systemctl start coach-api
sudo systemctl status coach-api
```

## 4. Export Data from Supabase and Import to Digital Ocean

### A. Export data from Supabase (on your local machine)

1. Create a script to export data from Supabase:

```javascript
// export-coaches.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCoaches() {
  try {
    const { data, error } = await supabase
      .from('health_coaches')
      .select('*');
    
    if (error) throw error;
    
    fs.writeFileSync('coaches.json', JSON.stringify(data, null, 2));
    console.log(`Exported ${data.length} coaches to coaches.json`);
  } catch (error) {
    console.error('Export error:', error);
  }
}

exportCoaches();
```

2. Run the script to create coaches.json:
```bash
node export-coaches.js
```

### B. Import data to Digital Ocean

Upload the JSON file to your server:
```bash
scp coaches.json main@165.232.150.178:~/coach-api/
```

Create an import script on the server:
```bash
cd ~/coach-api
nano import-data.js
```

Add:
```javascript
const fs = require('fs');
const axios = require('axios');

async function importData() {
  try {
    // Read the JSON file
    const coaches = JSON.parse(fs.readFileSync('./coaches.json', 'utf8'));
    console.log(`Found ${coaches.length} coaches to import`);
    
    // Send to the API for import
    const response = await axios.post('http://localhost:3000/api/import', coaches);
    console.log('Import response:', response.data);
  } catch (error) {
    console.error('Import error:', error);
  }
}

importData();
```

Install axios and run the import:
```bash
npm install axios
node import-data.js
```

## 5. Modify Your React Native App to Use Both Services

Create a new service that fetches coach data from Digital Ocean but keeps auth on Supabase:

```typescript
// services/api.ts
import { HealthCoach, HealthCoachSearchParams } from '../types';

const API_BASE_URL = 'http://165.232.150.178:3000/api';

export const getHealthCoaches = async (params: HealthCoachSearchParams = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.specialty) queryParams.append('specialty', params.specialty);
    if (params.rating) queryParams.append('rating', params.rating.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.searchTerm) queryParams.append('search', params.searchTerm);
    
    const response = await fetch(`${API_BASE_URL}/health-coaches?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      coaches: data.coaches,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: data.totalPages
    };
  } catch (error) {
    console.error('Failed to fetch health coaches:', error);
    throw error;
  }
};

export const getCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health-coaches/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch coach by ID:', error);
    return null;
  }
};
```

Then update your database.ts service:

```typescript
// services/database.ts - modify to use the new API file
import { getHealthCoaches as apiGetHealthCoaches, getCoachById as apiGetCoachById } from './api';
import { HealthCoach, HealthCoachSearchParams } from '../types';

// Other imports and code...

export const getHealthCoaches = async (params: HealthCoachSearchParams = {}) => {
  try {
    return await apiGetHealthCoaches(params);
  } catch (error) {
    console.error('Error in getHealthCoaches:', error);
    
    // If API fails, you could fall back to cached data or show error
    // For now, return empty result with pagination info
    return {
      coaches: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 0
    };
  }
};

export const getCoachById = async (id: string): Promise<HealthCoach | null> => {
  try {
    return await apiGetCoachById(id);
  } catch (error) {
    console.error('Error in getCoachById:', error);
    return null;
  }
};

// Keep other functions that don't relate to coach data as they are
```

## 6. Security Considerations

1. Set up firewall to only allow necessary ports:
```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw enable
```

2. Configure Nginx as a reverse proxy (recommended):
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/coach-api
```

Add:
```
server {
    listen 80;
    server_name 165.232.150.178;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Create symbolic link and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/coach-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. Set up HTTPS with Let's Encrypt (recommended for production):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
``` 