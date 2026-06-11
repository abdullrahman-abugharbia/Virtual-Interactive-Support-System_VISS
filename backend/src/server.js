const app = require('./app');
const env = require('./config/env');
const { pool, testConnection } = require('./config/db');

let server;

async function start() {
  await testConnection();

  server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API running on http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  } else {
    await pool.end();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error);
  await pool.end();
  process.exit(1);
});
