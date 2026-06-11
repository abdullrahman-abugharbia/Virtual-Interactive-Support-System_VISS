const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');
const { pool } = require('../config/db');
const env = require('../config/env');

async function ensureDatabase() {
  const dbName = env.dbName || 'react_ecommerce';
  const adminConfig = env.databaseUrl
    ? { connectionString: env.databaseUrl.replace(`/${dbName}`, '/postgres') }
    : {
        host: env.dbHost,
        port: env.dbPort,
        database: 'postgres',
        user: env.dbUser,
        password: env.dbPassword,
      };

  const client = new Client(adminConfig);
  await client.connect();
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rows.length) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    // eslint-disable-next-line no-console
    console.log(`Database "${dbName}" created.`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Database "${dbName}" already exists.`);
  }
  await client.end();
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run() {
  await ensureDatabase();

  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!files.length) {
    // eslint-disable-next-line no-console
    console.log('No migration files found.');
    return;
  }

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const executed = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (executed.has(file)) {
        // eslint-disable-next-line no-console
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Applying migration: ${file}`);

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
    }

    // eslint-disable-next-line no-console
    console.log('Migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
