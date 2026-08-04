const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString && !process.env.PGHOST) {
  throw new Error('DATABASE_URL or PostgreSQL PG* connection settings are required.');
}

const useSsl = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';

const pool = new Pool({
  ...(connectionString ? { connectionString } : {}),
  ssl: useSsl ? { rejectUnauthorized: true } : false,
  max: Number.parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
