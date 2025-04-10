# Plan for Migrating from Supabase to Digital Ocean

## Understanding the Credentials

Your PM has provided SSH credentials to access a Digital Ocean server:
- IP address: 165.232.150.178
- Username: main
- Password: BN@W1asqz@1

These credentials allow you to connect to the server via SSH, not directly use it as a database replacement for Supabase.

## Migration Steps

### 1. Initial Server Setup

First, you need to connect to the server and set up your database and API:

```bash
# SSH into the server
ssh main@165.232.150.178
# When prompted, enter the password: BN@W1asqz@1
```

### 2. Install and Configure PostgreSQL

Once logged in, you'll need to set up a database server:

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
CREATE DATABASE healthcoachdb;
CREATE USER healthcoachuser WITH ENCRYPTED PASSWORD 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON DATABASE healthcoachdb TO healthcoachuser;
\q

# Exit postgres user
exit
```

### 3. Set Up a Backend API

You need a backend API service to handle requests from your app:

```bash
# Install Node.js and npm
sudo apt install nodejs npm -y

# Create a directory for your API
mkdir -p /home/main/health-coach-api
cd /home/main/health-coach-api

# Initialize a new Node.js project
npm init -y
npm install express pg dotenv cors
```

### 4. Create API Server File

Create a basic Express server with PostgreSQL connection:

```bash
nano index.js
```

Add the following code:

```javascript
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'healthcoachuser',
  host: 'localhost',
  database: 'healthcoachdb',
  password: 'your_password_here', // Use the password you set earlier
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

// Health coaches endpoints
app.get('/api/health-coaches', async (req, res) => {
  try {
    const { specialty, rating, page = 1, limit = 20 } = req.query;
    
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
    
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 5. Run the API Server as a Service

Set up a systemd service to keep your API running:

```bash
sudo nano /etc/systemd/system/health-coach-api.service
```

Add the following:

```
[Unit]
Description=Health Coach API
After=network.target

[Service]
User=main
WorkingDirectory=/home/main/health-coach-api
ExecStart=/usr/bin/node /home/main/health-coach-api/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=health-coach-api

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable health-coach-api
sudo systemctl start health-coach-api
```

### 6. Migrate Your Data from Supabase

You'll need to export data from Supabase and import it into your PostgreSQL database.

1. Export from Supabase: Use their dashboard to export data as CSV or SQL dump.
2. Import to your PostgreSQL database:
   ```bash
   psql -U healthcoachuser -d healthcoachdb -f your_exported_data.sql
   ```

### 7. Modify Your React Native App

Create a new `api.ts` file to replace Supabase:

```typescript
// api.ts
const API_BASE_URL = 'http://165.232.150.178:3000/api';

export interface HealthCoach {
  id: string;
  name: string;
  bio: string;
  specialty: string;
  price: number;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  is_online: boolean;
  years_experience: number;
  avatar_url: string;
  location: string;
}

export interface HealthCoachSearchParams {
  specialty?: string;
  rating?: number;
  verified?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

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
    
    return await response.json();
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

// Add other API functions as needed...
```

### 8. Update the Auth Context

Since you were using Supabase for authentication, you'll need to set up auth on your Digital Ocean server too:

1. Add authentication endpoints to your API (signup, login, logout)
2. Update your AuthContext to use these endpoints instead of Supabase

## Security Considerations

1. **Database Security**: Make sure your PostgreSQL instance is properly secured
2. **API Security**: Add proper authentication middleware to your API
3. **HTTPS**: Set up SSL/TLS for your API server
4. **Environment Variables**: Store sensitive information in environment variables

## Additional Tips

1. Consider using PM2 for process management: `sudo npm install -g pm2`
2. Set up Nginx as a reverse proxy for your API
3. Configure a firewall: `sudo ufw enable` and open necessary ports
4. Set up auto-updates: `sudo apt install unattended-upgrades`

## Timeline for the Migration

1. Server setup and database configuration: 1-2 days
2. API development and testing: 2-3 days
3. Data migration: 1 day
4. React Native app updates: 2-3 days
5. Testing and bug fixing: 2-3 days

Total estimated time: 8-12 days depending on complexity and data volume 