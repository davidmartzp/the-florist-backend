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

const schemaPath = path.resolve(__dirname, '..', 'db', 'schema.sql');

if (!fs.existsSync(schemaPath)) {
  throw new Error(`Schema file not found: ${schemaPath}`);
}

const dbHost = getRequiredValue('DB_HOST', '127.0.0.1');
const dbPort = String(getConfigValue('DB_PORT', '3306'));
const dbUser = getRequiredValue('DB_USER', 'root');
const dbPassword = getConfigValue('DB_PASSWORD', '');
const dbName = getRequiredValue('DB_NAME');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const child = spawnSync(
  'mysql',
  ['-u', dbUser, '-h', dbHost, '-P', dbPort, dbName],
  {
    input: schemaSql,
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
