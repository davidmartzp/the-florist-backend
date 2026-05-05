const Catalog = require('../models/Catalog');
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

async function ensureCatalogExists(catalogId) {
  const catalog = await Catalog.findById(catalogId);

  if (!catalog) {
    throw new HttpError(404, 'Catalog not found');
  }

  return catalog;
}

async function ensureSlugIsAvailable(slug, excludedId = null) {
  const existingCatalog = await Catalog.findBySlug(slug);

  if (existingCatalog && existingCatalog.id !== Number(excludedId)) {
    throw new HttpError(409, 'A catalog with that slug already exists');
  }
}

async function listCatalogs(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['name', 'slug', 'isActive', 'createdAt', 'updatedAt'],
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });
  const { items, total } = await Catalog.listAll(pagination);
  return buildPaginatedResponse(items, total, pagination);
}

async function getCatalogById(catalogId) {
  return ensureCatalogExists(catalogId);
}

async function createCatalog(payload) {
  const name = validateName(payload.name);
  const slug = resolveSlug(name, payload.slug);
  const description = normalizeDescription(payload.description) ?? null;
  const isActive = normalizeIsActive(payload.isActive);

  await ensureSlugIsAvailable(slug);

  return Catalog.create({
    name,
    slug,
    description,
    isActive: isActive === undefined ? true : isActive,
  });
}

async function updateCatalog(catalogId, payload) {
  const currentCatalog = await ensureCatalogExists(catalogId);
  const updates = {};

  if (payload.name !== undefined) {
    updates.name = validateName(payload.name);
  }

  if (payload.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }

  if (payload.isActive !== undefined) {
    updates.isActive = normalizeIsActive(payload.isActive);
  }

  if (payload.slug !== undefined || updates.name !== undefined) {
    const slugBase = updates.name !== undefined ? updates.name : currentCatalog.name;
    updates.slug = resolveSlug(slugBase, payload.slug);
    await ensureSlugIsAvailable(updates.slug, currentCatalog.id);
  }

  if (!Object.keys(updates).length) {
    throw new HttpError(400, 'No valid fields were provided for update');
  }

  return Catalog.update(catalogId, updates);
}

async function toggleCatalogActive(catalogId) {
  const catalog = await ensureCatalogExists(catalogId);
  const nextActive = !catalog.isActive;
  await Catalog.update(catalogId, { isActive: nextActive });
  return { message: nextActive ? 'Catalog activated successfully' : 'Catalog deactivated successfully', isActive: nextActive };
}

module.exports = {
  createCatalog,
  toggleCatalogActive,
  getCatalogById,
  listCatalogs,
  updateCatalog,
};
