const { pool } = require('../config/db');

function mapShippingMethod(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price === null ? null : Number(row.price),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listAll(options = {}) {
  const sortColumns = {
    name: 'name',
    slug: 'slug',
    price: 'price',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const orderByColumn = sortColumns[options.sortBy] || 'name';
  const orderByDirection = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const limit = Number.isInteger(options.pageSize) && options.pageSize > 0 ? options.pageSize : 20;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM shipping_methods');
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, price, is_active, created_at, updated_at
      FROM shipping_methods
      ORDER BY ${orderByColumn} ${orderByDirection}, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  );

  return {
    items: rows.map(mapShippingMethod),
    total: countRows[0].total,
  };
}

async function listActive(options = {}) {
  const sortColumns = {
    name: 'name',
    slug: 'slug',
    price: 'price',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const orderByColumn = sortColumns[options.sortBy] || 'name';
  const orderByDirection = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const limit = Number.isInteger(options.pageSize) && options.pageSize > 0 ? options.pageSize : 20;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM shipping_methods WHERE is_active = 1'
  );
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, price, is_active, created_at, updated_at
      FROM shipping_methods
      WHERE is_active = 1
      ORDER BY ${orderByColumn} ${orderByDirection}, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  );

  return {
    items: rows.map(mapShippingMethod),
    total: countRows[0].total,
  };
}

async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, price, is_active, created_at, updated_at
      FROM shipping_methods
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapShippingMethod(rows[0]);
}

async function findBySlug(slug) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, price, is_active, created_at, updated_at
      FROM shipping_methods
      WHERE slug = ?
      LIMIT 1
    `,
    [slug]
  );

  return mapShippingMethod(rows[0]);
}

async function create({ name, slug, description, price, isActive }) {
  const [result] = await pool.execute(
    `
      INSERT INTO shipping_methods (name, slug, description, price, is_active)
      VALUES (?, ?, ?, ?, ?)
    `,
    [name, slug, description, price, isActive ? 1 : 0]
  );

  return findById(result.insertId);
}

async function update(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.slug !== undefined) {
    fields.push('slug = ?');
    values.push(updates.slug);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }

  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  if (!fields.length) {
    return findById(id);
  }

  values.push(id);

  await pool.execute(
    `
      UPDATE shipping_methods
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(id);
}

async function remove(id) {
  const [result] = await pool.execute(
    'UPDATE shipping_methods SET is_active = 0, updated_at = UTC_TIMESTAMP() WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  findBySlug,
  listAll,
  listActive,
  remove,
  update,
};
