const { pool } = require('../config/db');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ShippingMethod = require('../models/ShippingMethod');
const User = require('../models/User');
const HttpError = require('../utils/http-error');
const { buildPaginatedResponse, parseListQuery } = require('../utils/list-query');

const ORDER_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const BILLING_DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'PASAPORTE'];
const PAYMENT_PROVIDERS = ['tienda', 'whatsapp', 'otros', 'mercadopago'];
const MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
  };
}

function normalizePositiveInteger(value, fieldName) {
  const normalizedValue = Number(value);

  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }

  return normalizedValue;
}

function normalizeOrderStatus(value, options = {}) {
  if (value === undefined) {
    return options.defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (!ORDER_STATUSES.includes(normalizedValue)) {
    throw new HttpError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  return normalizedValue;
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new HttpError(400, 'items must be a non-empty array');
  }

  return items.map((item, index) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(400, `items[${index}].productId must be a positive integer`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, `items[${index}].quantity must be a positive integer`);
    }

    return { productId, quantity };
  });
}

function normalizeBoolean(value, fieldName) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  throw new HttpError(400, `${fieldName} must be true or false`);
}

function normalizeMoney(value, fieldName, options = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return options.allowNull ? null : 0;
  }

  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    throw new HttpError(400, `${fieldName} must be a number greater than or equal to 0`);
  }

  return roundMoney(normalizedValue);
}

function normalizeOptionalText(value, fieldName, options = {}) {
  if (value === undefined) {
    return options.defaultValue;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return options.required ? (() => {
      throw new HttpError(400, `${fieldName} is required`);
    })() : null;
  }

  if (options.maxLength && normalizedValue.length > options.maxLength) {
    throw new HttpError(400, `${fieldName} must contain at most ${options.maxLength} characters`);
  }

  return normalizedValue;
}

function normalizePaymentProvider(value, options = {}) {
  if (value === undefined) return options.defaultValue;
  if (value === null || String(value).trim() === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (!PAYMENT_PROVIDERS.includes(normalized)) {
    throw new HttpError(400, `paymentProvider must be one of: ${PAYMENT_PROVIDERS.join(', ')}`);
  }
  return normalized;
}

function normalizeBillingDocumentType(value, options = {}) {
  if (value === undefined) {
    return options.defaultValue;
  }

  if (value === null || String(value).trim() === '') {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();

  if (!BILLING_DOCUMENT_TYPES.includes(normalized)) {
    throw new HttpError(400, `billingDocumentType must be one of: ${BILLING_DOCUMENT_TYPES.join(', ')}`);
  }

  return normalized;
}

function normalizeOptionalEmail(value, fieldName, options = {}) {
  const normalizedValue = normalizeOptionalText(value, fieldName, options);

  if (normalizedValue === undefined || normalizedValue === null) {
    return normalizedValue;
  }

  const normalizedEmail = normalizedValue.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new HttpError(400, `${fieldName} must be a valid email`);
  }

  return normalizedEmail;
}

function ensureUniqueProductIds(items) {
  const seenProductIds = new Set();

  for (const item of items) {
    if (seenProductIds.has(item.productId)) {
      throw new HttpError(400, `Duplicate productId in items: ${item.productId}`);
    }

    seenProductIds.add(item.productId);
  }
}

async function generateOrderCode(connection) {
  const now = new Date();
  const month = MONTHS_ES[now.getMonth()];
  const year = String(now.getFullYear());
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = `${month}${year}${day}`;
  const maxCounter = await Order.getMaxDailyCounter(prefix, connection);
  const counter = String(maxCounter + 1).padStart(4, '0');
  return `${prefix}${counter}`;
}

async function assertUserExists(userId, connection) {
  if (userId === null || userId === undefined) {
    return null;
  }

  const user = await User.findById(userId, connection);

  if (!user) {
    throw new HttpError(400, `Unknown user id: ${userId}`);
  }

  return user;
}

function buildUserDisplayName(user) {
  if (!user) return null;
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
}

async function assertShippingMethodExists(shippingMethodId) {
  const shippingMethod = await ShippingMethod.findById(shippingMethodId);

  if (!shippingMethod) {
    throw new HttpError(400, `Unknown shippingMethodId: ${shippingMethodId}`);
  }

  return shippingMethod;
}

async function lockProducts(productIds, connection) {
  const products = await Product.findByIds(productIds, connection, { forUpdate: true });
  const productsById = new Map(products.map((product) => [product.id, product]));
  const missingProductIds = productIds.filter((productId) => !productsById.has(productId));

  if (missingProductIds.length) {
    throw new HttpError(400, `Unknown product ids: ${missingProductIds.join(', ')}`);
  }

  return productsById;
}

function buildItemsAndTotals(items, productsById, shippingConfig = {}) {
  const orderItems = [];
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const product = productsById.get(item.productId);
    const lineSubtotal = roundMoney(product.price * item.quantity);
    const lineTaxTotal = product.hasVat
      ? roundMoney(lineSubtotal * (product.vatRate / 100))
      : 0;
    const lineTotal = roundMoney(lineSubtotal + lineTaxTotal);

    subtotal = roundMoney(subtotal + lineSubtotal);
    taxTotal = roundMoney(taxTotal + lineTaxTotal);

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      hasVat: product.hasVat,
      vatRate: product.vatRate,
      subtotal: lineSubtotal,
      taxTotal: lineTaxTotal,
      total: lineTotal,
    });
  }

  const productsTotal = roundMoney(subtotal + taxTotal);
  const includedShippingPrice = shippingConfig.includesShippingPrice
    ? roundMoney(shippingConfig.shippingPrice || 0)
    : 0;

  return {
    items: orderItems,
    subtotal,
    taxTotal,
    shippingPrice: roundMoney(shippingConfig.shippingPrice || 0),
    includedShippingPrice,
    total: roundMoney(productsTotal + includedShippingPrice),
  };
}

async function persistStocks(stockByProductId, connection) {
  const updates = [];

  for (const [productId, stock] of stockByProductId.entries()) {
    updates.push(Product.setStock(productId, stock, connection));
  }

  await Promise.all(updates);
}

async function hydrateOrders(orders, connection) {
  if (!orders.length) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const userIds = [...new Set(orders.map((order) => order.userId).filter((userId) => userId != null))];
  const [items, users] = await Promise.all([
    Order.listItemsForOrderIds(orderIds, connection),
    User.listByIds(userIds, connection),
  ]);

  const itemsByOrderId = new Map();

  for (const item of items) {
    const orderItems = itemsByOrderId.get(item.orderId) || [];
    orderItems.push({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      hasVat: item.hasVat,
      vatRate: item.vatRate,
      subtotal: item.subtotal,
      taxTotal: item.taxTotal,
      total: item.total,
      createdAt: item.createdAt,
    });
    itemsByOrderId.set(item.orderId, orderItems);
  }

  const usersById = new Map(users.map((user) => [user.id, sanitizeUser(user)]));

  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    userId: order.userId,
    user: usersById.get(order.userId) || null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    billingDocument: order.billingDocument,
    billingDocumentType: order.billingDocumentType,
    billingCity: order.billingCity,
    shippingAddress: order.shippingAddress,
    includesCard: order.includesCard,
    cardMessage: order.cardMessage,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    cardSignature: order.cardSignature,
    deliveryDate: order.deliveryDate,
    shipping: order.shippingMethodId || order.shippingName || order.shippingPrice
      ? {
        shippingMethodId: order.shippingMethodId,
        name: order.shippingName,
        price: order.shippingPrice,
        includesPrice: order.includesShippingPrice,
        appliedPrice: order.includesShippingPrice ? order.shippingPrice : 0,
      }
      : null,
    subtotal: order.subtotal,
    taxTotal: order.taxTotal,
    total: order.total,
    status: order.status,
    isPaid: order.isPaid,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: itemsByOrderId.get(order.id) || [],
  }));
}

function resolveCustomerSnapshot(payload, user, currentOrder = null) {
  const defaultCustomerName = currentOrder && currentOrder.customerName
    ? currentOrder.customerName
    : buildUserDisplayName(user);
  const defaultCustomerEmail = currentOrder && currentOrder.customerEmail
    ? currentOrder.customerEmail
    : ((user && user.email) || null);
  const customerName = normalizeOptionalText(payload.customerName, 'customerName', {
    defaultValue: defaultCustomerName,
    maxLength: 150,
    required: true,
  });
  const customerEmail = normalizeOptionalEmail(payload.customerEmail, 'customerEmail', {
    defaultValue: defaultCustomerEmail,
    maxLength: 150,
  });
  const customerPhone = normalizeOptionalText(payload.customerPhone, 'customerPhone', {
    defaultValue: currentOrder ? currentOrder.customerPhone : null,
    maxLength: 50,
    required: true,
  });
  const billingDocument = normalizeOptionalText(payload.billingDocument, 'billingDocument', {
    defaultValue: currentOrder ? currentOrder.billingDocument : null,
    maxLength: 50,
    required: true,
  });
  const billingDocumentType = normalizeBillingDocumentType(payload.billingDocumentType, {
    defaultValue: currentOrder ? currentOrder.billingDocumentType : null,
  });
  const billingCity = normalizeOptionalText(payload.billingCity, 'billingCity', {
    defaultValue: currentOrder ? currentOrder.billingCity : null,
    maxLength: 100,
    required: true,
  });
  const shippingAddress = normalizeOptionalText(payload.shippingAddress, 'shippingAddress', {
    defaultValue: currentOrder ? currentOrder.shippingAddress : null,
    maxLength: 255,
    required: true,
  });
  const includesCard = payload.includesCard === undefined
    ? (currentOrder ? currentOrder.includesCard : false)
    : normalizeBoolean(payload.includesCard, 'includesCard');
  const cardMessage = includesCard
    ? normalizeOptionalText(payload.cardMessage, 'cardMessage', {
      defaultValue: currentOrder ? currentOrder.cardMessage : null,
      maxLength: 500,
    })
    : null;
  const receiverName = normalizeOptionalText(payload.receiverName, 'receiverName', {
    defaultValue: currentOrder ? currentOrder.receiverName : null,
    maxLength: 150,
    required: true,
  });
  const receiverPhone = normalizeOptionalText(payload.receiverPhone, 'receiverPhone', {
    defaultValue: currentOrder ? currentOrder.receiverPhone : null,
    maxLength: 50,
    required: true,
  });
  const cardSignature = normalizeOptionalText(payload.cardSignature, 'cardSignature', {
    defaultValue: currentOrder ? currentOrder.cardSignature : null,
    maxLength: 150,
  });
  const rawDeliveryDate = payload.deliveryDate !== undefined
    ? payload.deliveryDate
    : (currentOrder ? currentOrder.deliveryDate : undefined);
  const deliveryDate = rawDeliveryDate
    ? String(rawDeliveryDate).slice(0, 10)
    : null;

  return {
    customerName,
    customerEmail,
    customerPhone,
    billingDocument,
    billingDocumentType,
    billingCity,
    shippingAddress,
    includesCard,
    cardMessage,
    receiverName,
    receiverPhone,
    cardSignature,
    deliveryDate,
  };
}

async function resolveShippingConfiguration(payload, currentOrder = null) {
  const hasShippingMethodField = Object.prototype.hasOwnProperty.call(payload, 'shippingMethodId');
  const hasIncludeField = Object.prototype.hasOwnProperty.call(payload, 'includeShippingPrice');
  const hasShippingPriceField = Object.prototype.hasOwnProperty.call(payload, 'shippingPrice');
  const currentShipping = currentOrder ? currentOrder.shipping : null;

  if (!hasShippingMethodField && !hasIncludeField && !hasShippingPriceField) {
    if (currentOrder) {
      return {
        shippingMethodId: currentShipping && currentShipping.shippingMethodId !== undefined
          ? currentShipping.shippingMethodId
          : null,
        shippingName: currentShipping ? currentShipping.name : null,
        shippingPrice: currentShipping ? currentShipping.price : 0,
        includesShippingPrice: currentShipping ? currentShipping.includesPrice : false,
      };
    }

    return {
      shippingMethodId: null,
      shippingName: null,
      shippingPrice: 0,
      includesShippingPrice: false,
    };
  }

  const shippingMethodId = hasShippingMethodField
    ? (
      payload.shippingMethodId === null || payload.shippingMethodId === undefined
        ? null
        : normalizePositiveInteger(payload.shippingMethodId, 'shippingMethodId')
    )
    : (currentShipping ? currentShipping.shippingMethodId : null);
  const includesShippingPrice = payload.includeShippingPrice === undefined
    ? (
      currentShipping
        ? currentShipping.includesPrice
        : Boolean(shippingMethodId)
    )
    : normalizeBoolean(payload.includeShippingPrice, 'includeShippingPrice');
  const explicitShippingPrice = hasShippingPriceField
    ? normalizeMoney(payload.shippingPrice, 'shippingPrice', { allowNull: true })
    : undefined;

  if (!shippingMethodId) {
    if (hasIncludeField && includesShippingPrice) {
      throw new HttpError(400, 'includeShippingPrice requires shippingMethodId');
    }

    if (hasShippingPriceField && explicitShippingPrice !== null && explicitShippingPrice !== 0) {
      throw new HttpError(400, 'shippingPrice requires shippingMethodId');
    }

    return {
      shippingMethodId: null,
      shippingName: null,
      shippingPrice: 0,
      includesShippingPrice: false,
    };
  }

  const shippingMethod = await assertShippingMethodExists(shippingMethodId);
  const shippingPrice = explicitShippingPrice !== undefined
    ? (explicitShippingPrice === null ? 0 : explicitShippingPrice)
    : (
      currentShipping && currentShipping.shippingMethodId === shippingMethodId
        ? currentShipping.price
        : (shippingMethod.price === null ? 0 : shippingMethod.price)
    );

  if (includesShippingPrice && shippingPrice < 0) {
    throw new HttpError(400, 'shippingPrice must be greater than or equal to 0');
  }

  return {
    shippingMethodId: shippingMethod.id,
    shippingName: shippingMethod.name,
    shippingPrice,
    includesShippingPrice,
  };
}

async function getExistingOrderForMutation(orderId, connection) {
  const order = await Order.findById(orderId, connection, { forUpdate: true });

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  const [hydratedOrder] = await hydrateOrders([order], connection);
  return hydratedOrder;
}

async function listOrders(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['createdAt', 'updatedAt', 'subtotal', 'taxTotal', 'total', 'shippingPrice', 'status'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  const filters = {
    ...pagination,
    status: query.status ? normalizeOrderStatus(query.status) : undefined,
    isPaid: query.isPaid === 'true' ? true : query.isPaid === 'false' ? false : undefined,
    userId: query.userId !== undefined ? normalizePositiveInteger(query.userId, 'userId') : undefined,
    shippingMethodId: query.shippingMethodId !== undefined
      ? normalizePositiveInteger(query.shippingMethodId, 'shippingMethodId')
      : undefined,
  };
  const { items, total } = await Order.listAll(filters);
  const orders = await hydrateOrders(items);
  return buildPaginatedResponse(orders, total, pagination);
}

async function getOrderById(orderId) {
  const normalizedOrderId = normalizePositiveInteger(orderId, 'orderId');
  const order = await Order.findById(normalizedOrderId);

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  const [hydratedOrder] = await hydrateOrders([order]);
  return hydratedOrder;
}

async function createOrder(actorUserId, payload) {
  const userId = payload.userId !== undefined
    ? (payload.userId === null ? null : normalizePositiveInteger(payload.userId, 'userId'))
    : (actorUserId === null || actorUserId === undefined
      ? null
      : normalizePositiveInteger(actorUserId, 'userId'));
  const status = normalizeOrderStatus(payload.status, { defaultValue: 'pending' });
  const isPaid = payload.isPaid !== undefined ? normalizeBoolean(payload.isPaid, 'isPaid') : false;

  if (isPaid && status === 'pending') {
    throw new HttpError(400, 'Una orden pendiente no puede estar marcada como pagada');
  }

  if (status === 'completed' && !isPaid) {
    throw new HttpError(400, 'Una orden no pagada no puede crearse con estado completado');
  }

  const normalizedItems = normalizeOrderItems(payload.items);
  ensureUniqueProductIds(normalizedItems);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const user = await assertUserExists(userId, connection);
    const customerSnapshot = resolveCustomerSnapshot(payload, user);
    const shipping = await resolveShippingConfiguration(payload);

    const productIds = normalizedItems.map((item) => item.productId);
    const productsById = await lockProducts(productIds, connection);
    const stockByProductId = new Map();

    for (const product of productsById.values()) {
      stockByProductId.set(product.id, product.stock);
    }

    for (const item of normalizedItems) {
      const availableStock = stockByProductId.get(item.productId);

      if (availableStock < item.quantity) {
        throw new HttpError(409, `Not enough stock for product ${item.productId}`);
      }

      stockByProductId.set(item.productId, availableStock - item.quantity);
    }

    const totals = buildItemsAndTotals(normalizedItems, productsById, shipping);
    const code = await generateOrderCode(connection);
    const order = await Order.create(
      {
        code,
        userId,
        shippingMethodId: shipping.shippingMethodId,
        shippingName: shipping.shippingName,
        shippingPrice: totals.shippingPrice,
        includesShippingPrice: shipping.includesShippingPrice,
        customerName: customerSnapshot.customerName,
        customerEmail: customerSnapshot.customerEmail,
        customerPhone: customerSnapshot.customerPhone,
        billingDocument: customerSnapshot.billingDocument,
        billingDocumentType: customerSnapshot.billingDocumentType,
        billingCity: customerSnapshot.billingCity,
        shippingAddress: customerSnapshot.shippingAddress,
        includesCard: customerSnapshot.includesCard,
        cardMessage: customerSnapshot.cardMessage,
        receiverName: customerSnapshot.receiverName,
        receiverPhone: customerSnapshot.receiverPhone,
        cardSignature: customerSnapshot.cardSignature,
        deliveryDate: customerSnapshot.deliveryDate,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status,
        isPaid,
        paymentProvider: normalizePaymentProvider(payload.paymentProvider, { defaultValue: payload.paymentReference ? 'mercadopago' : null }),
        paymentReference: payload.paymentReference ?? null,
      },
      connection
    );

    await Order.replaceItems(order.id, totals.items, connection);
    await persistStocks(stockByProductId, connection);
    await connection.commit();

    return getOrderById(order.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrder(orderId, payload) {
  const normalizedOrderId = normalizePositiveInteger(orderId, 'orderId');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const existingOrder = await getExistingOrderForMutation(normalizedOrderId, connection);

    if (existingOrder.status === 'completed') {
      const hasShipping = (existingOrder.shipping?.price ?? 0) > 0;
      const restricted = [
        'userId', 'customerName', 'customerEmail', 'customerPhone',
        'billingDocument', 'billingDocumentType', 'billingCity',
        'shippingMethodId', 'includeShippingPrice', 'shippingPrice',
        'items', 'deliveryDate', 'cardMessage', 'cardSignature', 'includesCard',
        'status', 'isPaid', 'paymentProvider',
        ...(hasShipping ? [] : ['receiverName', 'receiverPhone', 'shippingAddress']),
      ];
      const violations = restricted.filter((f) => Object.prototype.hasOwnProperty.call(payload, f));
      if (violations.length) {
        throw new HttpError(400, hasShipping
          ? 'Una orden completada solo permite actualizar receptor y dirección de envío'
          : 'Una orden completada no puede modificarse');
      }
    }

    if (existingOrder.paymentProvider === 'mercadopago') {
      const restrictedFields = ['userId', 'customerName', 'customerEmail', 'customerPhone',
        'billingDocument', 'billingCity', 'shippingAddress', 'shippingMethodId',
        'includeShippingPrice', 'shippingPrice', 'items', 'receiverName', 'receiverPhone',
        'deliveryDate', 'paymentProvider'];
      const providedRestricted = restrictedFields.filter(
        (field) => Object.prototype.hasOwnProperty.call(payload, field)
      );
      if (providedRestricted.length) {
        throw new HttpError(400, 'Las órdenes pagadas con MercadoPago solo permiten actualizar el estado y la tarjeta del pedido');
      }
    }

    const nextUserId = payload.userId !== undefined
      ? (payload.userId === null ? null : normalizePositiveInteger(payload.userId, 'userId'))
      : existingOrder.userId;
    const nextStatus = payload.status !== undefined
      ? normalizeOrderStatus(payload.status)
      : existingOrder.status;
    const nextIsPaid = payload.isPaid !== undefined
      ? normalizeBoolean(payload.isPaid, 'isPaid')
      : existingOrder.isPaid;
    const nextPaymentProvider = normalizePaymentProvider(payload.paymentProvider, {
      defaultValue: existingOrder.paymentProvider,
    });

    if (existingOrder.status !== 'pending' && nextStatus === 'pending') {
      throw new HttpError(400, 'Una orden confirmada no puede volver a estado pendiente');
    }

    if (nextIsPaid && nextStatus === 'pending') {
      throw new HttpError(400, 'Una orden pendiente no puede estar marcada como pagada');
    }

    if (nextStatus === 'completed' && !nextIsPaid) {
      throw new HttpError(400, 'Una orden no pagada no puede cambiar a estado completado');
    }

    const nextItems = payload.items !== undefined
      ? normalizeOrderItems(payload.items)
      : existingOrder.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    ensureUniqueProductIds(nextItems);
    const user = await assertUserExists(nextUserId, connection);
    const customerSnapshot = resolveCustomerSnapshot(payload, user, existingOrder);
    const shipping = await resolveShippingConfiguration(payload, existingOrder);

    const affectedProductIds = [...new Set([
      ...existingOrder.items.map((item) => item.productId),
      ...nextItems.map((item) => item.productId),
    ])];
    const productsById = affectedProductIds.length
      ? await lockProducts(affectedProductIds, connection)
      : new Map();
    const stockByProductId = new Map();

    for (const product of productsById.values()) {
      stockByProductId.set(product.id, product.stock);
    }

    for (const item of existingOrder.items) {
      stockByProductId.set(item.productId, (stockByProductId.get(item.productId) || 0) + item.quantity);
    }

    for (const item of nextItems) {
      const availableStock = stockByProductId.get(item.productId);

      if (availableStock < item.quantity) {
        throw new HttpError(409, `Not enough stock for product ${item.productId}`);
      }

      stockByProductId.set(item.productId, availableStock - item.quantity);
    }

    const totals = buildItemsAndTotals(nextItems, productsById, shipping);

    await Order.update(
      normalizedOrderId,
      {
        userId: nextUserId,
        shippingMethodId: shipping.shippingMethodId,
        shippingName: shipping.shippingName,
        shippingPrice: totals.shippingPrice,
        includesShippingPrice: shipping.includesShippingPrice,
        customerName: customerSnapshot.customerName,
        customerEmail: customerSnapshot.customerEmail,
        customerPhone: customerSnapshot.customerPhone,
        billingDocument: customerSnapshot.billingDocument,
        billingDocumentType: customerSnapshot.billingDocumentType,
        billingCity: customerSnapshot.billingCity,
        shippingAddress: customerSnapshot.shippingAddress,
        includesCard: customerSnapshot.includesCard,
        cardMessage: customerSnapshot.cardMessage,
        receiverName: customerSnapshot.receiverName,
        receiverPhone: customerSnapshot.receiverPhone,
        cardSignature: customerSnapshot.cardSignature,
        deliveryDate: customerSnapshot.deliveryDate,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: nextStatus,
        isPaid: nextIsPaid,
        paymentProvider: nextPaymentProvider,
      },
      connection
    );
    await Order.replaceItems(normalizedOrderId, totals.items, connection);
    await persistStocks(stockByProductId, connection);
    await connection.commit();

    return getOrderById(normalizedOrderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function exportOrders(query = {}) {
  const filters = {
    pageSize: 100000,
    offset: 0,
    status: query.status ? normalizeOrderStatus(query.status) : undefined,
    isPaid: query.isPaid === 'true' ? true : query.isPaid === 'false' ? false : undefined,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
  const { items } = await Order.listAll(filters);
  return hydrateOrders(items);
}

async function toggleOrderActive(orderId) {
  const normalizedOrderId = normalizePositiveInteger(orderId, 'orderId');
  const order = await Order.findById(normalizedOrderId);

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  const nextActive = !order.isActive;
  await Order.update(normalizedOrderId, { isActive: nextActive });
  return { message: nextActive ? 'Order activated successfully' : 'Order deactivated successfully', isActive: nextActive };
}

module.exports = {
  createOrder,
  exportOrders,
  toggleOrderActive,
  getOrderById,
  listOrders,
  updateOrder,
};
