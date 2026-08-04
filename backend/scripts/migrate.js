const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { pool } = require('../src/config/database');

const migrationsDirectory = path.resolve(__dirname, '..', 'migrations');

async function run() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const exists = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [file],
      );

      if (exists.rowCount > 0) {
        console.log(`Skipping ${file}; already applied.`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');

      console.log(`Applying ${file}...`);
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('Database migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});
