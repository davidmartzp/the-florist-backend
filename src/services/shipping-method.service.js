const ShippingMethod = require('../models/ShippingMethod');
const HttpError = require('../utils/http-error');
const slugify = require('../utils/slugify');
const { buildPaginatedResponse, parseListQuery } = require('../utils/list-query');

function validateName(name) {
  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    throw new HttpError(400, 'name is required');
  }

  return normalizedName;
}

function normalizeDescription(description) {
  if (description === undefined) {
    return undefined;
  }

  const normalizedDescription = String(description).trim();
  return normalizedDescription || null;
}

function normalizePrice(price) {
  if (price === undefined) {
    return undefined;
  }

  if (price === null || price === '') {
    return null;
  }

  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw new HttpError(400, 'price must be a number greater than or equal to 0');
  }

  return Number(normalizedPrice.toFixed(2));
}

function normalizeIsActive(isActive) {
  if (isActive === undefined) {
    return undefined;
  }

  return Boolean(isActive);
}

function resolveSlug(name, customSlug) {
  const source = customSlug !== undefined ? customSlug : name;
  const slug = slugify(source);

  if (!slug) {
    throw new HttpError(400, 'A valid slug could not be generated');
  }

  return slug;
}

async function ensureShippingMethodExists(shippingMethodId) {
  const shippingMethod = await ShippingMethod.findById(shippingMethodId);

  if (!shippingMethod) {
    throw new HttpError(404, 'Shipping method not found');
  }

  return shippingMethod;
}

async function ensureSlugIsAvailable(slug, excludedId = null) {
  const existingShippingMethod = await ShippingMethod.findBySlug(slug);

  if (existingShippingMethod && existingShippingMethod.id !== Number(excludedId)) {
    throw new HttpError(409, 'A shipping method with that slug already exists');
  }
}

async function listShippingMethods(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['name', 'slug', 'price', 'isActive', 'createdAt', 'updatedAt'],
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });
  const { items, total } = await ShippingMethod.listAll(pagination);
  return buildPaginatedResponse(items, total, pagination);
}

async function getShippingMethodById(shippingMethodId) {
  return ensureShippingMethodExists(shippingMethodId);
}

async function createShippingMethod(payload) {
  const name = validateName(payload.name);
  const slug = resolveSlug(name, payload.slug);
  const description = normalizeDescription(payload.description) ?? null;
  const price = normalizePrice(payload.price) ?? null;
  const isActive = normalizeIsActive(payload.isActive);

  await ensureSlugIsAvailable(slug);

  return ShippingMethod.create({
    name,
    slug,
    description,
    price,
    isActive: isActive === undefined ? true : isActive,
  });
}

async function updateShippingMethod(shippingMethodId, payload) {
  const currentShippingMethod = await ensureShippingMethodExists(shippingMethodId);
  const updates = {};

  if (payload.name !== undefined) {
    updates.name = validateName(payload.name);
  }

  if (payload.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }

  if (payload.price !== undefined) {
    updates.price = normalizePrice(payload.price);
  }

  if (payload.isActive !== undefined) {
    updates.isActive = normalizeIsActive(payload.isActive);
  }

  if (payload.slug !== undefined || updates.name !== undefined) {
    const slugBase = updates.name !== undefined ? updates.name : currentShippingMethod.name;
    updates.slug = resolveSlug(slugBase, payload.slug);
    await ensureSlugIsAvailable(updates.slug, currentShippingMethod.id);
  }

  if (!Object.keys(updates).length) {
    throw new HttpError(400, 'No valid fields were provided for update');
  }

  return ShippingMethod.update(shippingMethodId, updates);
}

async function deleteShippingMethod(shippingMethodId) {
  await ensureShippingMethodExists(shippingMethodId);
  await ShippingMethod.remove(shippingMethodId);
  return { message: 'Shipping method deleted successfully' };
}

module.exports = {
  createShippingMethod,
  deleteShippingMethod,
  getShippingMethodById,
  listShippingMethods,
  updateShippingMethod,
};
