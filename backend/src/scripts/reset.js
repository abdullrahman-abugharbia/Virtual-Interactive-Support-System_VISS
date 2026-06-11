const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../config/db');

async function runSqlFiles(client, dirPath) {
  const files = (await fs.readdir(dirPath))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(dirPath, file), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Executing: ${file}`);
    await client.query(sql);
  }
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;

      DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

      DROP TYPE IF EXISTS payment_status CASCADE;
      DROP TYPE IF EXISTS payment_method CASCADE;
      DROP TYPE IF EXISTS order_status CASCADE;
      DROP TYPE IF EXISTS app_role CASCADE;
    `);

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const seedsDir = path.join(__dirname, '../database/seeds');

    await runSqlFiles(client, migrationsDir);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const filename of migrationFiles) {
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    }

    await runSqlFiles(client, seedsDir);

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('Database reset complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Database reset failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
