const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Uso: node scripts/reset-password.js <email> <nueva-contraseña>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [hash, email]
  );

  if (result.affectedRows === 0) {
    console.error(`No se encontró ningún usuario con email: ${email}`);
    process.exit(1);
  }

  console.log(`Contraseña actualizada correctamente para ${email}`);
  pool.end();
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
