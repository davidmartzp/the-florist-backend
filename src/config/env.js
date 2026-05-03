const dotenv = require('dotenv');

dotenv.config();

function getRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumber(name, fallback) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

const port = getNumber('PORT', 3000);

module.exports = {
  port,
  appUrl: process.env.APP_URL || `http://localhost:${port}`,
  jwtSecret: getRequired('JWT_SECRET'),
  passwordResetTokenTtlMinutes: getNumber('PASSWORD_RESET_TOKEN_TTL_MINUTES', 30),
  db: {
    host: getRequired('DB_HOST'),
    port: getNumber('DB_PORT', 3306),
    user: getRequired('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    database: getRequired('DB_NAME'),
    waitForConnections: true,
    connectionLimit: getNumber('DB_CONNECTION_LIMIT', 10),
    queueLimit: 0,
  },
};
