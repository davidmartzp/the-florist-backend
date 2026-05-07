const { pool } = require('../config/db');

function getExecutor(connection) {
  return connection || pool;
}

function formatDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapOrder(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    shippingMethodId: row.shipping_method_id,
    shippingName: row.shipping_name,
    shippingPrice: Number(row.shipping_price),
    includesShippingPrice: Boolean(row.includes_shipping_price),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    billingDocument: row.billing_document,
    billingDocumentType: row.billing_document_type,
    billingCity: row.billing_city,
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    includesCard: Boolean(row.includes_card),
    cardMessage: row.card_message,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    cardSignature: row.card_signature,
    deliveryDate: formatDateOnly(row.delivery_date),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    status: row.status,
    isPaid: Boolean(row.is_paid),
    isActive: Boolean(row.is_active),
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItem(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    hasVat: Boolean(row.has_vat),
    vatRate: Number(row.vat_rate),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    createdAt: row.created_at,
  };
}

async function listAll(filters = {}) {
  const whereClauses = [];
  const values = [];
  const sortColumns = {
    createdAt: 'o.created_at',
    updatedAt: 'o.updated_at',
    subtotal: 'o.subtotal',
    taxTotal: 'o.tax_total',
    total: 'o.total',
    shippingPrice: 'o.shipping_price',
    status: 'o.status',
  };

  if (filters.status) {
    whereClauses.push('o.status = ?');
    values.push(filters.status);
  }

  if (filters.userId !== undefined) {
    whereClauses.push('o.user_id = ?');
    values.push(filters.userId);
  }

  if (filters.shippingMethodId !== undefined) {
    whereClauses.push('o.shipping_method_id = ?');
    values.push(filters.shippingMethodId);
  }

  if (filters.isPaid !== undefined) {
    whereClauses.push('o.is_paid = ?');
    values.push(filters.isPaid ? 1 : 0);
  }

  if (filters.isActive !== undefined) {
    whereClauses.push('o.is_active = ?');
    values.push(filters.isActive ? 1 : 0);
  } else {
    whereClauses.push('o.is_active = 1');
  }

  if (filters.deliveryDateFrom) {
    whereClauses.push('o.delivery_date >= ?');
    values.push(filters.deliveryDateFrom);
  }

  if (filters.deliveryDateTo) {
    whereClauses.push('o.delivery_date <= ?');
    values.push(filters.deliveryDateTo);
  }

  if (filters.orderDateFrom) {
    whereClauses.push('DATE(o.created_at) >= ?');
    values.push(filters.orderDateFrom);
  }

  if (filters.orderDateTo) {
    whereClauses.push('DATE(o.created_at) <= ?');
    values.push(filters.orderDateTo);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const orderByColumn = sortColumns[filters.sortBy] || 'o.created_at';
  const orderByDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const limit = Number.isInteger(filters.pageSize) && filters.pageSize > 0 ? filters.pageSize : 20;
  const offset = Number.isInteger(filters.offset) && filters.offset >= 0 ? filters.offset : 0;

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM orders o
      ${whereSql}
    `,
    values
  );

  const [rows] = await pool.execute(
    `
      SELECT o.id, o.code, o.user_id, o.shipping_method_id, o.shipping_name, o.shipping_price,
             o.includes_shipping_price, o.customer_name, o.customer_email, o.customer_phone,
             o.billing_document, o.billing_document_type, o.billing_city, o.billing_address, o.shipping_address, o.includes_card, o.card_message,
             o.receiver_name, o.receiver_phone, o.card_signature, o.delivery_date,
             o.subtotal, o.tax_total, o.total, o.status, o.is_paid, o.is_active,
             o.payment_provider, o.payment_reference,
             o.created_at, o.updated_at
      FROM orders o
      ${whereSql}
      ORDER BY ${orderByColumn} ${orderByDirection}, o.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  return {
    items: rows.map(mapOrder),
    total: countRows[0].total,
  };
}

async function findById(id, connection, options = {}) {
  const executor = getExecutor(connection);
  const forUpdate = options.forUpdate ? ' FOR UPDATE' : '';
  const [rows] = await executor.execute(
    `
      SELECT id, code, user_id, shipping_method_id, shipping_name, shipping_price,
             includes_shipping_price, customer_name, customer_email, customer_phone,
             billing_document, billing_document_type, billing_city, billing_address, shipping_address, includes_card, card_message,
             receiver_name, receiver_phone, card_signature, delivery_date,
             subtotal, tax_total, total, status, is_paid, is_active,
             payment_provider, payment_reference,
             created_at, updated_at
      FROM orders
      WHERE id = ?
      LIMIT 1${forUpdate}
    `,
    [id]
  );

  return mapOrder(rows[0]);
}

async function getMaxDailyCounter(datePrefix, connection) {
  const executor = getExecutor(connection);
  const [rows] = await executor.execute(
    `
      SELECT COALESCE(MAX(CAST(SUBSTR(code, 10) AS UNSIGNED)), 0) AS max_counter
      FROM orders
      WHERE code LIKE ? FOR UPDATE
    `,
    [`${datePrefix}%`]
  );
  return Number(rows[0].max_counter);
}

async function create(orderData, connection) {
  const executor = getExecutor(connection);
  const [result] = await executor.execute(
    `
      INSERT INTO orders (
        code,
        user_id,
        shipping_method_id,
        shipping_name,
        shipping_price,
        includes_shipping_price,
        customer_name,
        customer_email,
        customer_phone,
        billing_document,
        billing_document_type,
        billing_city,
        billing_address,
        shipping_address,
        includes_card,
        card_message,
        receiver_name,
        receiver_phone,
        card_signature,
        delivery_date,
        subtotal,
        tax_total,
        total,
        status,
        is_paid,
        payment_provider,
        payment_reference,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, UTC_TIMESTAMP()))
    `,
    [
      orderData.code,
      orderData.userId,
      orderData.shippingMethodId,
      orderData.shippingName,
      orderData.shippingPrice,
      orderData.includesShippingPrice,
      orderData.customerName,
      orderData.customerEmail,
      orderData.customerPhone,
      orderData.billingDocument,
      orderData.billingDocumentType ?? null,
      orderData.billingCity,
      orderData.billingAddress ?? null,
      orderData.shippingAddress,
      orderData.includesCard,
      orderData.cardMessage,
      orderData.receiverName,
      orderData.receiverPhone,
      orderData.cardSignature,
      orderData.deliveryDate,
      orderData.subtotal,
      orderData.taxTotal,
      orderData.total,
      orderData.status,
      orderData.isPaid ? 1 : 0,
      orderData.paymentProvider || null,
      orderData.paymentReference || null,
      orderData.createdAt || null,
    ]
  );

  return findById(result.insertId, connection);
}

async function update(id, updates, connection) {
  const executor = getExecutor(connection);
  const fields = [];
  const values = [];

  if (updates.userId !== undefined) {
    fields.push('user_id = ?');
    values.push(updates.userId);
  }

  if (updates.shippingMethodId !== undefined) {
    fields.push('shipping_method_id = ?');
    values.push(updates.shippingMethodId);
  }

  if (updates.shippingName !== undefined) {
    fields.push('shipping_name = ?');
    values.push(updates.shippingName);
  }

  if (updates.shippingPrice !== undefined) {
    fields.push('shipping_price = ?');
    values.push(updates.shippingPrice);
  }

  if (updates.includesShippingPrice !== undefined) {
    fields.push('includes_shipping_price = ?');
    values.push(updates.includesShippingPrice);
  }

  if (updates.customerName !== undefined) {
    fields.push('customer_name = ?');
    values.push(updates.customerName);
  }

  if (updates.customerEmail !== undefined) {
    fields.push('customer_email = ?');
    values.push(updates.customerEmail);
  }

  if (updates.customerPhone !== undefined) {
    fields.push('customer_phone = ?');
    values.push(updates.customerPhone);
  }

  if (updates.billingDocument !== undefined) {
    fields.push('billing_document = ?');
    values.push(updates.billingDocument);
  }

  if (updates.billingDocumentType !== undefined) {
    fields.push('billing_document_type = ?');
    values.push(updates.billingDocumentType);
  }

  if (updates.billingCity !== undefined) {
    fields.push('billing_city = ?');
    values.push(updates.billingCity);
  }

  if (updates.billingAddress !== undefined) {
    fields.push('billing_address = ?');
    values.push(updates.billingAddress);
  }

  if (updates.shippingAddress !== undefined) {
    fields.push('shipping_address = ?');
    values.push(updates.shippingAddress);
  }

  if (updates.includesCard !== undefined) {
    fields.push('includes_card = ?');
    values.push(updates.includesCard);
  }

  if (updates.cardMessage !== undefined) {
    fields.push('card_message = ?');
    values.push(updates.cardMessage);
  }

  if (updates.receiverName !== undefined) {
    fields.push('receiver_name = ?');
    values.push(updates.receiverName);
  }

  if (updates.receiverPhone !== undefined) {
    fields.push('receiver_phone = ?');
    values.push(updates.receiverPhone);
  }

  if (updates.cardSignature !== undefined) {
    fields.push('card_signature = ?');
    values.push(updates.cardSignature);
  }

  if (updates.deliveryDate !== undefined) {
    fields.push('delivery_date = ?');
    values.push(updates.deliveryDate);
  }

  if (updates.paymentProvider !== undefined) {
    fields.push('payment_provider = ?');
    values.push(updates.paymentProvider);
  }

  if (updates.paymentReference !== undefined) {
    fields.push('payment_reference = ?');
    values.push(updates.paymentReference);
  }

  if (updates.subtotal !== undefined) {
    fields.push('subtotal = ?');
    values.push(updates.subtotal);
  }

  if (updates.taxTotal !== undefined) {
    fields.push('tax_total = ?');
    values.push(updates.taxTotal);
  }

  if (updates.total !== undefined) {
    fields.push('total = ?');
    values.push(updates.total);
  }

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.isPaid !== undefined) {
    fields.push('is_paid = ?');
    values.push(updates.isPaid ? 1 : 0);
  }

  if (!fields.length) {
    return findById(id, connection);
  }

  values.push(id);

  await executor.execute(
    `
      UPDATE orders
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
    'UPDATE orders SET is_active = 0, updated_at = UTC_TIMESTAMP() WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

async function listItemsForOrderIds(orderIds, connection) {
  if (!orderIds.length) {
    return [];
  }

  const executor = getExecutor(connection);
  const placeholders = orderIds.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `
      SELECT id, order_id, product_id, product_name, quantity, unit_price,
             has_vat, vat_rate, subtotal, tax_total, total, created_at
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY order_id ASC, id ASC
    `,
    orderIds
  );

  return rows.map(mapOrderItem);
}

async function replaceItems(orderId, items, connection) {
  const executor = getExecutor(connection);
  await executor.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);

  if (!items.length) {
    return;
  }

  const values = items.map((item) => ([
    orderId,
    item.productId,
    item.productName,
    item.quantity,
    item.unitPrice,
    item.hasVat,
    item.vatRate,
    item.subtotal,
    item.taxTotal,
    item.total,
  ]));

  await executor.query(
    `
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        has_vat,
        vat_rate,
        subtotal,
        tax_total,
        total
      )
      VALUES ?
    `,
    [values]
  );
}

module.exports = {
  create,
  findById,
  getMaxDailyCounter,
  listAll,
  listItemsForOrderIds,
  remove,
  replaceItems,
  update,
};
