const { pool } = require('../config/db');

function mapProductPriceHistory(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    productId: row.product_id,
    price: Number(row.price),
    hasVat: Boolean(row.has_vat),
    vatRate: Number(row.vat_rate),
    changeType: row.change_type,
    createdAt: row.created_at,
  };
}

async function create(entry, connection) {
  const executor = connection || pool;

  const [result] = await executor.execute(
    `
      INSERT INTO product_price_history (
        product_id,
        price,
        has_vat,
        vat_rate,
        change_type
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      entry.productId,
      entry.price,
      entry.hasVat,
      entry.vatRate,
      entry.changeType,
    ]
  );

  const [rows] = await executor.execute(
    `
      SELECT id, product_id, price, has_vat, vat_rate, change_type, created_at
      FROM product_price_history
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  return mapProductPriceHistory(rows[0]);
}

async function listByProductId(productId) {
  const [rows] = await pool.execute(
    `
      SELECT id, product_id, price, has_vat, vat_rate, change_type, created_at
      FROM product_price_history
      WHERE product_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [productId]
  );

  return rows.map(mapProductPriceHistory);
}

module.exports = {
  create,
  listByProductId,
};
