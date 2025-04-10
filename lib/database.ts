import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false // Required for DigitalOcean
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Health Coach queries
export const getHealthCoaches = async (params: {
  specialty?: string;
  rating?: number;
  verified?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}) => {
  const {
    specialty,
    rating,
    verified,
    searchTerm,
    page = 1,
    limit = 20
  } = params;

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM health_coaches WHERE 1=1';
  const values: any[] = [];
  let paramCount = 1;

  if (specialty) {
    query += ` AND specialty = $${paramCount}`;
    values.push(specialty);
    paramCount++;
  }

  if (rating) {
    query += ` AND rating >= $${paramCount}`;
    values.push(rating);
    paramCount++;
  }

  if (verified !== undefined) {
    query += ` AND is_verified = $${paramCount}`;
    values.push(verified);
    paramCount++;
  }

  if (searchTerm) {
    query += ` AND (name ILIKE $${paramCount} OR bio ILIKE $${paramCount})`;
    values.push(`%${searchTerm}%`);
    paramCount++;
  }

  query += ` ORDER BY rating DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return {
      data: result.rows,
      total: result.rowCount
    };
  } catch (error) {
    console.error('Error fetching health coaches:', error);
    throw error;
  }
};

export const getHealthCoachById = async (id: string) => {
  try {
    const result = await pool.query(
      'SELECT * FROM health_coaches WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching health coach:', error);
    throw error;
  }
};

// Favorites queries
export const addHealthCoachToFavorites = async (userId: string, healthCoachId: string) => {
  try {
    const result = await pool.query(
      'INSERT INTO favorites (user_id, health_coach_id) VALUES ($1, $2) RETURNING *',
      [userId, healthCoachId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeHealthCoachFromFavorites = async (userId: string, healthCoachId: string) => {
  try {
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND health_coach_id = $2 RETURNING *',
      [userId, healthCoachId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    const result = await pool.query(
      'SELECT health_coach_id FROM favorites WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => row.health_coach_id);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
}; 