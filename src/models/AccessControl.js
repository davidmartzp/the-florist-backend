const { pool } = require('../config/db');

function getExecutor(connection) {
  return connection || pool;
}

async function listPermissions() {
  const [rows] = await pool.execute(
    `
      SELECT code, name, description
      FROM permissions
      ORDER BY code ASC
    `
  );

  return rows;
}

async function listPermissionsByCodes(codes) {
  if (!codes.length) {
    return [];
  }

  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `
      SELECT id, code, name, description
      FROM permissions
      WHERE code IN (${placeholders})
    `,
    codes
  );

  return rows;
}

async function listPermissionCodesForUser(userId) {
  const [rows] = await pool.execute(
    `
      SELECT p.code
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = ?
      ORDER BY p.code ASC
    `,
    [userId]
  );

  return rows.map((row) => row.code);
}

async function replaceUserPermissions(userId, permissionCodes, connection) {
  const executor = getExecutor(connection);

  await executor.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

  if (!permissionCodes.length) {
    return;
  }

  const placeholders = permissionCodes.map(() => '?').join(', ');

  await executor.execute(
    `
      INSERT INTO user_permissions (user_id, permission_id)
      SELECT ?, id
      FROM permissions
      WHERE code IN (${placeholders})
    `,
    [userId, ...permissionCodes]
  );
}

module.exports = {
  listPermissions,
  listPermissionsByCodes,
  listPermissionCodesForUser,
  replaceUserPermissions,
};
