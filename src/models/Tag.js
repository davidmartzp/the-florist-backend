const { pool } = require('../config/db');

function mapTag(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listAll() {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      ORDER BY name ASC
    `
  );

  return rows.map(mapTag);
}

async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapTag(rows[0]);
}

async function findBySlug(slug) {
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE slug = ?
      LIMIT 1
    `,
    [slug]
  );

  return mapTag(rows[0]);
}

async function listByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE id IN (${placeholders})
      ORDER BY name ASC
    `,
    ids
  );

  return rows.map(mapTag);
}

async function create({ name, slug }) {
  const [result] = await pool.execute(
    `
      INSERT INTO tags (name, slug)
      VALUES (?, ?)
    `,
    [name, slug]
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

  if (!fields.length) {
    return findById(id);
  }

  values.push(id);

  await pool.execute(
    `
      UPDATE tags
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM tags WHERE id = ?', [id]);
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
