const { pool } = require('../config/db');

function mapCatalog(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listAll(options = {}) {
  const sortColumns = {
    name: 'name',
    slug: 'slug',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const orderByColumn = sortColumns[options.sortBy] || 'name';
  const orderByDirection = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const limit = Number.isInteger(options.pageSize) && options.pageSize > 0 ? options.pageSize : 20;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM catalogs');
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM catalogs
      ORDER BY ${orderByColumn} ${orderByDirection}, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  );

  return {
    items: rows.map(mapCatalog),
    total: countRows[0].total,
  };
}

async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM catalogs
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapCatalog(rows[0]);
}

async function findBySlug(slug) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM catalogs
      WHERE slug = ?
      LIMIT 1
    `,
    [slug]
  );

  return mapCatalog(rows[0]);
}

async function listByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM catalogs
      WHERE id IN (${placeholders})
      ORDER BY name ASC
    `,
    ids
  );

  return rows.map(mapCatalog);
}

async function create({ name, slug, description, isActive }) {
  const [result] = await pool.execute(
    `
      INSERT INTO catalogs (name, slug, description, is_active)
      VALUES (?, ?, ?, ?)
    `,
    [name, slug, description, isActive ? 1 : 0]
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
      UPDATE catalogs
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM catalogs WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  listByIds,
  findBySlug,
  listAll,
  remove,
  update,
};
