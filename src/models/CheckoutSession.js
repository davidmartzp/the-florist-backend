const { pool } = require('../config/db');

async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapCheckoutSession(row) {
  if (!row) {
    return null;
  }

  let payload = null;

  try {
    payload = row.payload ? JSON.parse(row.payload) : null;
  } catch {
    payload = null;
  }

  return {
    id: row.id,
    preferenceId: row.preference_id,
    payload,
    status: row.status,
    paymentReference: row.payment_reference,
    orderId: row.order_id,
    orderCode: row.order_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ preferenceId, payload, status, paymentReference, orderId, orderCode }) {
  const [result] = await pool.execute(
    `
      INSERT INTO checkout_sessions (
        preference_id,
        payload,
        status,
        payment_reference,
        order_id,
        order_code
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      preferenceId,
      JSON.stringify(payload),
      status || 'created',
      paymentReference || null,
      orderId || null,
      orderCode || null,
    ]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT id, preference_id, payload, status, payment_reference, order_id, order_code, created_at, updated_at
      FROM checkout_sessions
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapCheckoutSession(rows[0]);
}

async function findByPreferenceId(preferenceId, connection) {
  const executor = connection || pool;
  const [rows] = await executor.execute(
    `
      SELECT id, preference_id, payload, status, payment_reference, order_id, order_code, created_at, updated_at
      FROM checkout_sessions
      WHERE preference_id = ?
      LIMIT 1
    `,
    [preferenceId]
  );

  return mapCheckoutSession(rows[0]);
}

async function findByPreferenceIdForUpdate(preferenceId, connection) {
  const executor = connection || pool;
  const [rows] = await executor.execute(
    `
      SELECT id, preference_id, payload, status, payment_reference, order_id, order_code, created_at, updated_at
      FROM checkout_sessions
      WHERE preference_id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [preferenceId]
  );

  return mapCheckoutSession(rows[0]);
}

async function update(id, updates, connection) {
  const executor = connection || pool;
  const fields = [];
  const values = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.paymentReference !== undefined) {
    fields.push('payment_reference = ?');
    values.push(updates.paymentReference);
  }

  if (updates.orderId !== undefined) {
    fields.push('order_id = ?');
    values.push(updates.orderId);
  }

  if (updates.orderCode !== undefined) {
    fields.push('order_code = ?');
    values.push(updates.orderCode);
  }

  if (updates.payload !== undefined) {
    fields.push('payload = ?');
    values.push(JSON.stringify(updates.payload));
  }

  if (!fields.length) {
    return findById(id, connection);
  }

  values.push(id);

  await executor.execute(
    `
      UPDATE checkout_sessions
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(id, connection);
}

module.exports = {
  create,
  findById,
  findByPreferenceId,
  findByPreferenceIdForUpdate,
  update,
  withTransaction,
};
