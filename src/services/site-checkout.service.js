const crypto = require('crypto');
const { pool } = require('../config/db');
const CheckoutSession = require('../models/CheckoutSession');
const OrderService = require('./order.service');
const ShippingMethod = require('../models/ShippingMethod');
const HttpError = require('../utils/http-error');

function normalizeString(value, fieldName, options = {}) {
  if (value === undefined) {
    return options.defaultValue;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    if (options.required) {
      throw new HttpError(400, `${fieldName} is required`);
    }
    return null;
  }

  if (options.maxLength && normalizedValue.length > options.maxLength) {
    throw new HttpError(400, `${fieldName} must contain at most ${options.maxLength} characters`);
  }

  return normalizedValue;
}

function normalizeEmail(value, fieldName, options = {}) {
  const normalizedValue = normalizeString(value, fieldName, options);

  if (normalizedValue === undefined || normalizedValue === null) {
    return normalizedValue;
  }

  const lowercased = normalizedValue.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lowercased)) {
    throw new HttpError(400, `${fieldName} must be a valid email`);
  }

  return lowercased;
}

function normalizePositiveInteger(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = Number(value);

  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }

  return normalizedValue;
}

function normalizeCartItems(cart) {
  if (!Array.isArray(cart) || !cart.length) {
    throw new HttpError(400, 'cart must be a non-empty array');
  }

  return cart.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new HttpError(400, `cart[${index}] must be an object`);
    }

    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const name = item.name ? String(item.name).trim() : null;

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(400, `cart[${index}].productId must be a positive integer`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, `cart[${index}].quantity must be a positive integer`);
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new HttpError(400, `cart[${index}].unitPrice must be a number greater than or equal to 0`);
    }

    return {
      productId,
      quantity,
      unitPrice,
      name: name || `Product ${productId}`,
    };
  });
}

const BILLING_DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'PASAPORTE'];

function normalizeBillingDocumentType(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();

  if (!BILLING_DOCUMENT_TYPES.includes(normalized)) {
    throw new HttpError(400, `billingDocumentType must be one of: ${BILLING_DOCUMENT_TYPES.join(', ')}`);
  }

  return normalized;
}

function normalizeReturnUrl(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

async function createCheckoutSession(payload) {
  const session = await CheckoutSession.create(payload);
  return session;
}

async function createCheckoutPreference(payload) {
  const normalizedCart = normalizeCartItems(payload.cart);
  const customerName = normalizeString(payload.customerName, 'customerName', { required: true, maxLength: 150 });
  const customerPhone = normalizeString(payload.customerPhone, 'customerPhone', { required: true, maxLength: 50 });
  const customerEmail = normalizeEmail(payload.customerEmail, 'customerEmail', { required: true, maxLength: 150 });
  const billingDocument = normalizeString(payload.billingDocument, 'billingDocument', { required: true, maxLength: 50 });
  const billingDocumentType = normalizeBillingDocumentType(payload.billingDocumentType);
  const billingCity = normalizeString(payload.billingCity, 'billingCity', { required: true, maxLength: 100 });
  const billingAddress = normalizeString(payload.billingAddress, 'billingAddress', { maxLength: 255 });
  const shippingAddress = normalizeString(payload.deliveryAddress, 'deliveryAddress', { maxLength: 255 });
  const cardMessage = normalizeString(payload.cardMessage, 'cardMessage', { maxLength: 500 });
  const receiverName = normalizeString(payload.receiverName, 'receiverName', { required: true, maxLength: 150 });
  const receiverPhone = normalizeString(payload.receiverPhone, 'receiverPhone', { required: true, maxLength: 50 });
  const cardSignature = normalizeString(payload.cardSignature, 'cardSignature', { maxLength: 150 });
  const deliveryDate = normalizeString(payload.deliveryDate, 'deliveryDate', { required: true });
  const shippingMethodId = payload.shippingMethodId === null || payload.shippingMethodId === undefined || payload.shippingMethodId === ''
    ? null
    : normalizePositiveInteger(payload.shippingMethodId, 'shippingMethodId');
  const returnUrl = normalizeReturnUrl(payload.returnUrl) || `${process.env.APP_URL || 'http://localhost:3000'}/checkout`;

  let shippingMethod = null;
  let shippingItem = null;

  if (shippingMethodId) {
    shippingMethod = await ShippingMethod.findById(shippingMethodId);

    if (!shippingMethod) {
      throw new HttpError(400, `Unknown shippingMethodId: ${shippingMethodId}`);
    }

    if (shippingMethod.price !== null && shippingMethod.price > 0) {
      shippingItem = {
        title: `Envío - ${shippingMethod.name}`,
        quantity: 1,
        unit_price: shippingMethod.price,
      };
    }
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
  }

  const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
  const preferenceApi = new Preference(mpClient);
  const paymentApi = new Payment(mpClient);

  const preferenceItems = normalizedCart.map((entry) => ({
    title: entry.name,
    quantity: entry.quantity,
    unit_price: entry.unitPrice,
  }));

  if (shippingItem) {
    preferenceItems.push(shippingItem);
  }

  const callbackUrl = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}paymentSuccess=1`;

  const isPublicUrl = /^https?:\/\/(?!localhost|127\.0\.0\.1)/.test(callbackUrl);

  const notificationUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/api/site/checkout/webhook`
    : null;

  const preference = {
    items: preferenceItems,
    payer: {
      name: customerName,
      email: customerEmail,
      phone: {
        number: customerPhone,
      },
    },
    back_urls: {
      success: callbackUrl,
      failure: callbackUrl,
      pending: callbackUrl,
    },
    ...(isPublicUrl ? { auto_return: 'approved' } : {}),
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  const response = await preferenceApi.create({ body: preference });
  const preferenceId = response.id || response.preference_id || null;

  if (!preferenceId) {
    throw new HttpError(500, 'Could not create MercadoPago preference');
  }

  await createCheckoutSession({
    preferenceId,
    payload: {
      cart: normalizedCart,
      customerName,
      customerPhone,
      customerEmail,
      billingDocument,
      billingDocumentType,
      billingCity,
      billingAddress,
      deliveryAddress: shippingAddress,
      cardMessage,
      shippingMethodId,
      receiverName,
      receiverPhone,
      cardSignature,
      deliveryDate,
    },
    status: 'created',
  });

  const isLocalhost = /localhost|127\.0\.0\.1/.test(returnUrl);
  const checkoutUrl = (isLocalhost && response.sandbox_init_point)
    ? response.sandbox_init_point
    : response.init_point;

  return {
    init_point: checkoutUrl,
    sandbox_init_point: response.sandbox_init_point,
    preferenceId,
  };
}

async function confirmCheckoutPayment(payload) {
  const preferenceId = normalizeString(payload.preferenceId, 'preferenceId', { required: true });
  const collectionId = normalizeString(payload.collectionId, 'collectionId', { required: true });
  const collectionStatus = normalizeString(payload.collectionStatus || payload.status, 'collectionStatus', { required: true });

  if (collectionStatus.toLowerCase() !== 'approved') {
    throw new HttpError(400, 'Payment is not approved');
  }

  // Verificar el pago real con la API de MercadoPago ANTES del lock
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
  }

  const { MercadoPagoConfig, Payment } = require('mercadopago');
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
  const paymentApi = new Payment(mpClient);

  let payment;
  try {
    payment = await paymentApi.get({ id: collectionId });
  } catch (mpError) {
    throw new HttpError(502, `MercadoPago verification failed: ${mpError.message || 'Unknown error'}`);
  }

  if (!payment || payment.status !== 'approved') {
    throw new HttpError(400, 'Payment verification failed: payment is not approved');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const session = await CheckoutSession.findByPreferenceIdForUpdate(preferenceId, connection);

    if (!session) {
      throw new HttpError(404, 'Checkout session not found');
    }

    if (session.orderId) {
      await connection.commit();
      return { alreadyConfirmed: true, orderId: session.orderId };
    }

    const orderPayload = {
      items: session.payload.cart,
      customerName: session.payload.customerName,
      customerEmail: session.payload.customerEmail,
      customerPhone: session.payload.customerPhone,
      billingDocument: session.payload.billingDocument,
      billingDocumentType: session.payload.billingDocumentType,
      billingCity: session.payload.billingCity,
      billingAddress: session.payload.billingAddress,
      shippingAddress: session.payload.deliveryAddress,
      includesCard: !!session.payload.cardMessage,
      cardMessage: session.payload.cardMessage,
      receiverName: session.payload.receiverName,
      receiverPhone: session.payload.receiverPhone,
      cardSignature: session.payload.cardSignature,
      deliveryDate: session.payload.deliveryDate,
      shippingMethodId: session.payload.shippingMethodId,
      paymentReference: collectionId,
      isPaid: true,
      status: 'confirmed',
    };

    const order = await OrderService.createOrder(null, orderPayload);

    await CheckoutSession.update(session.id, {
      status: 'confirmed',
      paymentReference: collectionId,
      orderId: order.id,
      orderCode: order.code,
    }, connection);

    await connection.commit();
    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function verifyWebhookSignature(headers, dataId) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // si no está configurado, no bloquear

  const xSignature = headers['x-signature'];
  const xRequestId = headers['x-request-id'];
  if (!xSignature) return false;

  const ts = xSignature.split(',').find((p) => p.startsWith('ts='))?.split('=')[1];
  const v1 = xSignature.split(',').find((p) => p.startsWith('v1='))?.split('=')[1];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return computed === v1;
}

async function processWebhook(payload, headers = {}) {
  const dataId = payload?.data?.id;

  const isPayment =
    payload?.type === 'payment' ||
    payload?.action?.startsWith('payment.');

  if (!isPayment || !dataId) {
    return { processed: false, reason: 'Not a payment notification' };
  }

  if (!verifyWebhookSignature(headers, dataId)) {
    // eslint-disable-next-line no-console
    console.warn('[Webhook] Invalid signature, ignoring');
    return { processed: false, reason: 'Invalid signature' };
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
  }

  const { MercadoPagoConfig, Payment } = require('mercadopago');
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
  const paymentApi = new Payment(mpClient);

  // Reintentos: MP a veces envía el webhook antes de que el pago esté indexado
  let payment;
  let attempts = 3;

  while (attempts--) {
    try {
      payment = await paymentApi.get({ id: Number(dataId) });
      break;
    } catch (mpError) {
      const is404 = mpError?.status === 404 || mpError?.cause?.[0]?.code === 2000;
      if (is404) {
        // eslint-disable-next-line no-console
        console.log('[Webhook] Payment not found in MP (id=%s), skipping', dataId);
        return { processed: false, reason: 'Payment not found' };
      }
      if (attempts === 0) {
        // eslint-disable-next-line no-console
        console.error('[Webhook] MP get payment error:', mpError);
        throw new HttpError(502, `MercadoPago verification failed: ${mpError.message || 'Unknown error'}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // eslint-disable-next-line no-console
  console.log('[Webhook] Pago obtenido | id=%s | status=%s | monto=%s %s | fecha=%s | payer=%s',
    payment.id,
    payment.status,
    payment.currency_id,
    payment.transaction_amount,
    payment.date_approved || payment.date_created,
    payment.payer?.email || '(sin email)'
  );

  // Validación de estado
  if (!payment || payment.status !== 'approved') {
    return {
      processed: false,
      reason: 'Payment not approved',
      status: payment?.status,
      id: dataId,
    };
  }

  // Obtener preference_id de forma segura
  const preferenceId =
    payment.preference_id ||
    payment.metadata?.preference_id ||
    payment.additional_info?.items?.[0]?.id;

  // eslint-disable-next-line no-console
  console.log('[Webhook] preference_id=%s', preferenceId || '(no encontrado)');

  if (!preferenceId) {
    return {
      processed: false,
      reason: 'No preference_id found in payment',
      paymentId: dataId,
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const session =
      await CheckoutSession.findByPreferenceIdForUpdate(
        preferenceId,
        connection
      );

    // eslint-disable-next-line no-console
    console.log('[Webhook] session=%s orderId=%s', session ? session.id : '(no encontrada)', session?.orderId || 'null');

    if (!session) {
      await connection.commit();
      return {
        processed: false,
        reason: 'Checkout session not found',
        preferenceId,
      };
    }

    // Idempotencia
    if (session.orderId) {
      await connection.commit();
      return {
        processed: true,
        alreadyConfirmed: true,
        orderId: session.orderId,
      };
    }

    const orderPayload = {
      items: session.payload.cart,
      customerName: session.payload.customerName,
      customerEmail: session.payload.customerEmail,
      customerPhone: session.payload.customerPhone,
      billingDocument: session.payload.billingDocument,
      billingDocumentType: session.payload.billingDocumentType,
      billingCity: session.payload.billingCity,
      billingAddress: session.payload.billingAddress,
      shippingAddress: session.payload.deliveryAddress,
      includesCard: !!session.payload.cardMessage,
      cardMessage: session.payload.cardMessage,
      receiverName: session.payload.receiverName,
      receiverPhone: session.payload.receiverPhone,
      cardSignature: session.payload.cardSignature,
      deliveryDate: session.payload.deliveryDate,
      shippingMethodId: session.payload.shippingMethodId,
      paymentReference: String(dataId),
      isPaid: true,
      status: 'confirmed',
    };

    const order = await OrderService.createOrder(null, orderPayload);

    await CheckoutSession.update(
      session.id,
      {
        status: 'confirmed',
        paymentReference: String(dataId),
        orderId: order.id,
        orderCode: order.code,
      },
      connection
    );

    await connection.commit();

    return {
      processed: true,
      orderId: order.id,
    };
  } catch (error) {
    await connection.rollback();
    console.error('PROCESS WEBHOOK ERROR:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createCheckoutPreference,
  confirmCheckoutPayment,
  processWebhook,
};
