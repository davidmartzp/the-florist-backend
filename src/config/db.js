const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool(env.db);

async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

module.exports = {
  pool,
  testConnection,
};
