const app = require('./app');
const { testConnection } = require('./config/db');
const env = require('./config/env');

async function startServer() {
  await testConnection();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
