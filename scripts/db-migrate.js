const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

function getConfigValue(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
}

function getRequiredValue(name, fallback) {
  const value = getConfigValue(name, fallback);
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.log('No migrations directory found. Skipping.');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (!files.length) {
  console.log('No migration files found.');
  process.exit(0);
}

const dbHost = getRequiredValue('DB_HOST', '127.0.0.1');
const dbPort = String(getConfigValue('DB_PORT', '3306'));
const dbUser = getRequiredValue('DB_USER', 'root');
const dbPassword = getConfigValue('DB_PASSWORD', '');
const dbName = getRequiredValue('DB_NAME');

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running migration: ${file}`);
  const child = spawnSync(
    'mysql',
    ['-u', dbUser, '-h', dbHost, '-P', dbPort, dbName],
    {
      input: sql,
      stdio: ['pipe', 'inherit', 'inherit'],
      env: {
        ...process.env,
        MYSQL_PWD: dbPassword,
      },
    }
  );
  if (child.error) {
    throw child.error;
  }
  if (child.status !== 0) {
    process.exit(child.status || 1);
  }
}

console.log('Migrations completed.');
