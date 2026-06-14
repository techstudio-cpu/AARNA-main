const { Pool } = require('pg');
require('dotenv').config();

// Validate required environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  DATABASE_URL not set in production. PostgreSQL connection will fail.');
}

const postgresConfig = databaseUrl
  ? {
      // Use connection string from Railway (individual props MUST NOT be set or they override the string)
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool settings - optimized for Railway
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false
    }
  : {
      // Local development: use individual env vars
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'aarna_solars',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: false,
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false
    };

// Create connection pool
const pool = new Pool(postgresConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Test connection function
async function testPostgresConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ PostgreSQL connected at:', result.rows[0].current_time);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    if (process.env.NODE_ENV === 'production' && !databaseUrl) {
      console.error('   DATABASE_URL environment variable is not set');
    }
    return false;
  }
}

// Query helper function
async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('PostgreSQL query error:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  testPostgresConnection
};
