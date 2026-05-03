const { pool } = require('../config/db');

function getExecutor(connection) {
  return connection || pool;
}

function mapProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    hasVat: Boolean(row.has_vat),
    vatRate: Number(row.vat_rate),
    stock: row.stock,
    description: row.description,
    image: row.image,
    type: row.type || 'GENERAL',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listAll(filters = {}) {
  const whereClauses = [];
  const values = [];
  const sortColumns = {
    name: 'p.name',
    price: 'p.price',
    vatRate: 'p.vat_rate',
    stock: 'p.stock',
    createdAt: 'p.created_at',
    updatedAt: 'p.updated_at',
  };

  if (filters.search) {
    whereClauses.push('(LOWER(p.name) LIKE ? OR LOWER(COALESCE(p.description, "")) LIKE ?)');
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.minPrice !== undefined) {
    whereClauses.push('p.price >= ?');
    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    whereClauses.push('p.price <= ?');
    values.push(filters.maxPrice);
  }

  if (filters.inStock === true) {
    whereClauses.push('p.stock > 0');
  } else if (filters.inStock === false) {
    whereClauses.push('p.stock = 0');
  }

  if (filters.categoryIds && filters.categoryIds.length) {
    const placeholders = filters.categoryIds.map(() => '?').join(', ');
    whereClauses.push(
      `EXISTS (
        SELECT 1
        FROM product_categories pc
        WHERE pc.product_id = p.id
          AND pc.category_id IN (${placeholders})
      )`
    );
    values.push(...filters.categoryIds);
  }

  if (filters.type) {
    whereClauses.push('p.type = ?');
    values.push(filters.type);
  }

  if (filters.isActive !== undefined) {
    whereClauses.push('p.is_active = ?');
    values.push(filters.isActive ? 1 : 0);
  }

  if (filters.tagIds && filters.tagIds.length) {
    const placeholders = filters.tagIds.map(() => '?').join(', ');
    whereClauses.push(
      `EXISTS (
        SELECT 1
        FROM product_tags pt
        WHERE pt.product_id = p.id
          AND pt.tag_id IN (${placeholders})
      )`
    );
    values.push(...filters.tagIds);
  }

  if (filters.catalogIds && filters.catalogIds.length) {
    const placeholders = filters.catalogIds.map(() => '?').join(', ');
    whereClauses.push(
      `EXISTS (
        SELECT 1
        FROM product_catalogs pco
        WHERE pco.product_id = p.id
          AND pco.catalog_id IN (${placeholders})
      )`
    );
    values.push(...filters.catalogIds);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const orderByColumn = sortColumns[filters.sortBy] || 'p.created_at';
  const orderByDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const limit = Number.isInteger(filters.pageSize) && filters.pageSize > 0 ? filters.pageSize : 20;
  const offset = Number.isInteger(filters.offset) && filters.offset >= 0 ? filters.offset : 0;
  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM products p
      ${whereSql}
    `,
    values
  );
  const [rows] = await pool.execute(
    `
      SELECT p.id, p.name, p.price, p.has_vat, p.vat_rate, p.stock, p.description, p.image, p.type, p.is_active, p.created_at, p.updated_at
      FROM products p
      ${whereSql}
      ORDER BY ${orderByColumn} ${orderByDirection}, p.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  return {
    items: rows.map(mapProduct),
    total: countRows[0].total,
  };
}

function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function findById(id, connection) {
  const executor = getExecutor(connection);
  const [rows] = await executor.execute(
    `
      SELECT id, name, price, has_vat, vat_rate, stock, description, image, type, is_active, created_at, updated_at
      FROM products
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapProduct(rows[0]);
}

async function findBySlug(slug, connection) {
  if (!slug) {
    return null;
  }

  const executor = getExecutor(connection);
  const searchPattern = `%${slug.split('-').join('%')}%`;
  const [rows] = await executor.execute(
    `
      SELECT id, name, price, has_vat, vat_rate, stock, description, image, type, is_active, created_at, updated_at
      FROM products
      WHERE LOWER(name) LIKE ?
        AND is_active = 1
      LIMIT 20
    `,
    [searchPattern]
  );

  const products = rows.map(mapProduct);
  return products.find((product) => slugifyName(product.name) === slug) || null;
}

async function findByIds(ids, connection, options = {}) {
  if (!ids.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = ids.map(() => '?').join(', ');
  const forUpdate = options.forUpdate ? ' FOR UPDATE' : '';
  const [rows] = await executor.execute(
    `
      SELECT id, name, price, has_vat, vat_rate, stock, description, image, type, is_active, created_at, updated_at
      FROM products
      WHERE id IN (${placeholders})
      ORDER BY id ASC${forUpdate}
    `,
    ids
  );

  return rows.map(mapProduct);
}

async function create(productData, connection) {
  const executor = getExecutor(connection);
  const [result] = await executor.execute(
    `
      INSERT INTO products (name, price, has_vat, vat_rate, stock, description, image, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      productData.name,
      productData.price,
      productData.hasVat,
      productData.vatRate,
      productData.stock,
      productData.description,
      productData.image,
      productData.type || 'GENERAL',
    ]
  );

  return findById(result.insertId, connection);
}

async function update(id, updates, connection) {
  const executor = getExecutor(connection);
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }

  if (updates.hasVat !== undefined) {
    fields.push('has_vat = ?');
    values.push(updates.hasVat);
  }

  if (updates.vatRate !== undefined) {
    fields.push('vat_rate = ?');
    values.push(updates.vatRate);
  }

  if (updates.stock !== undefined) {
    fields.push('stock = ?');
    values.push(updates.stock);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.image !== undefined) {
    fields.push('image = ?');
    values.push(updates.image);
  }

    if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }

  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  values.push(id);

  await executor.execute(
    `
      UPDATE products
      SET ${fields.join(', ')},
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    values
  );

  return findById(id, connection);
}

async function remove(id, connection) {
  const executor = getExecutor(connection);
  const [result] = await executor.execute(
    'UPDATE products SET is_active = 0, updated_at = UTC_TIMESTAMP() WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

async function setStock(id, stock, connection) {
  const executor = getExecutor(connection);
  await executor.execute(
    `
      UPDATE products
      SET stock = ?,
          updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [stock, id]
  );
}

async function replaceCategories(productId, categoryIds, connection) {
  const executor = getExecutor(connection);
  await executor.execute('DELETE FROM product_categories WHERE product_id = ?', [productId]);

  if (!categoryIds.length) {
    return;
  }

  const values = categoryIds.map((categoryId) => [productId, categoryId]);
  await executor.query(
    `
      INSERT INTO product_categories (product_id, category_id)
      VALUES ?
    `,
    [values]
  );
}

async function replaceTags(productId, tagIds, connection) {
  const executor = getExecutor(connection);
  await executor.execute('DELETE FROM product_tags WHERE product_id = ?', [productId]);

  if (!tagIds.length) {
    return;
  }

  const values = tagIds.map((tagId) => [productId, tagId]);
  await executor.query(
    `
      INSERT INTO product_tags (product_id, tag_id)
      VALUES ?
    `,
    [values]
  );
}

async function replaceCatalogs(productId, catalogIds, connection) {
  const executor = getExecutor(connection);
  await executor.execute('DELETE FROM product_catalogs WHERE product_id = ?', [productId]);

  if (!catalogIds.length) {
    return;
  }

  const values = catalogIds.map((catalogId) => [productId, catalogId]);
  await executor.query(
    `
      INSERT INTO product_catalogs (product_id, catalog_id)
      VALUES ?
    `,
    [values]
  );
}

async function listCategoriesForProductIds(productIds, connection) {
  if (!productIds.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `
      SELECT pc.product_id, c.id, c.name, c.slug, c.description, c.created_at, c.updated_at
      FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id IN (${placeholders})
      ORDER BY c.name ASC
    `,
    productIds
  );

  return rows.map((row) => ({
    productId: row.product_id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function listTagsForProductIds(productIds, connection) {
  if (!productIds.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `
      SELECT pt.product_id, t.id, t.name, t.slug, t.created_at, t.updated_at
      FROM product_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.product_id IN (${placeholders})
      ORDER BY t.name ASC
    `,
    productIds
  );

  return rows.map((row) => ({
    productId: row.product_id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function listCatalogsForProductIds(productIds, connection) {
  if (!productIds.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `
      SELECT pc.product_id, c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at
      FROM product_catalogs pc
      JOIN catalogs c ON c.id = pc.catalog_id
      WHERE pc.product_id IN (${placeholders})
      ORDER BY c.name ASC
    `,
    productIds
  );

  return rows.map((row) => ({
    productId: row.product_id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

module.exports = {
  create,
  findById,
  findByIds,
  findBySlug,
  listAll,
  listCatalogsForProductIds,
  listCategoriesForProductIds,
  listTagsForProductIds,
  remove,
  replaceCatalogs,
  replaceCategories,
  replaceTags,
  setStock,
  update,
};
