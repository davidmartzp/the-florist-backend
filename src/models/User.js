const { pool } = require('../config/db');

const userSelect = `
  SELECT id, email, first_name, last_name, password_hash, is_active,
         deactivated_at, reset_password_token_hash, reset_password_expires_at,
         created_at, updated_at
  FROM users
`;

function getExecutor(connection) {
  return connection || pool;
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
    deactivatedAt: row.deactivated_at,
    resetPasswordTokenHash: row.reset_password_token_hash,
    resetPasswordExpiresAt: row.reset_password_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(`${userSelect} WHERE email = ? LIMIT 1`, [email]);

  return mapUser(rows[0]);
}

async function findById(id, connection) {
  const executor = getExecutor(connection);
  const [rows] = await executor.execute(`${userSelect} WHERE id = ? LIMIT 1`, [id]);

  return mapUser(rows[0]);
}

async function listAll(options = {}) {
  const sortColumns = {
    email: 'email',
    firstName: 'first_name',
    lastName: 'last_name',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const orderByColumn = sortColumns[options.sortBy] || 'created_at';
  const orderByDirection = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const limit = Number.isInteger(options.pageSize) && options.pageSize > 0 ? options.pageSize : 20;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM users');
  const [rows] = await pool.execute(
    `${userSelect} ORDER BY ${orderByColumn} ${orderByDirection}, id DESC LIMIT ${limit} OFFSET ${offset}`
  );

  return {
    items: rows.map(mapUser),
    total: countRows[0].total,
  };
}

async function listByIds(ids, connection) {
  if (!ids.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `${userSelect} WHERE id IN (${placeholders}) ORDER BY id ASC`,
    ids
  );

  return rows.map(mapUser);
}

async function findByResetTokenHash(tokenHash) {
  const [rows] = await pool.execute(
    `
      ${userSelect}
      WHERE reset_password_token_hash = ?
        AND reset_password_expires_at IS NOT NULL
        AND reset_password_expires_at > UTC_TIMESTAMP()
      LIMIT 1
    `,
    [tokenHash]
  );

  return mapUser(rows[0]);
}

async function create(userData, connection) {
  const executor = getExecutor(connection);
  const [result] = await executor.execute(
    `
      INSERT INTO users (
        email,
        first_name,
        last_name,
        password_hash,
        is_active
      )
      VALUES (?, ?, ?, ?, 1)
    `,
    [
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.passwordHash,
    ]
  );

  return findById(result.insertId, connection);
}

async function update(userId, updates, connection) {
  const executor = getExecutor(connection);
  const fields = [];
  const values = [];

  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (updates.firstName !== undefined) {
    fields.push('first_name = ?');
    values.push(updates.firstName);
  }

  if (updates.lastName !== undefined) {
    fields.push('last_name = ?');
    values.push(updates.lastName);
  }

  if (updates.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.passwordHash);
  }

  if (!fields.length) {
    return findById(userId, connection);
  }

  values.push(userId);

  await executor.execute(
    `
      UPDATE users
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(userId, connection);
}

async function setPasswordResetToken(userId, tokenHash, expiresAt) {
  await pool.execute(
    `
      UPDATE users
      SET reset_password_token_hash = ?,
          reset_password_expires_at = ?,
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [tokenHash, expiresAt, userId]
  );
}

async function deactivate(userId) {
  await pool.execute(
    `
      UPDATE users
      SET is_active = 0,
          deactivated_at = UTC_TIMESTAMP(),
          reset_password_token_hash = NULL,
          reset_password_expires_at = NULL,
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [userId]
  );
}

async function updatePassword(userId, passwordHash) {
  await pool.execute(
    `
      UPDATE users
      SET password_hash = ?,
          reset_password_token_hash = NULL,
          reset_password_expires_at = NULL,
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [passwordHash, userId]
  );
}

module.exports = {
  create,
  deactivate,
  findByEmail,
  findById,
  findByResetTokenHash,
  listByIds,
  listAll,
  setPasswordResetToken,
  update,
  updatePassword,
};
