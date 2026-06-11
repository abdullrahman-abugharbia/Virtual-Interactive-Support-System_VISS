const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const seedsDir = path.join(__dirname, '../database/seeds');
  const files = (await fs.readdir(seedsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!files.length) {
    // eslint-disable-next-line no-console
    console.log('No seed files found.');
    return;
  }

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = await fs.readFile(path.join(seedsDir, file), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Running seed: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }

    // eslint-disable-next-line no-console
    console.log('Seeds completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
