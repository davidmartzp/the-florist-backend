const Category = require('../models/Category');
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

function resolveSlug(name, customSlug) {
  const source = customSlug !== undefined ? customSlug : name;
  const slug = slugify(source);

  if (!slug) {
    throw new HttpError(400, 'A valid slug could not be generated');
  }

  return slug;
}

async function ensureCategoryExists(categoryId) {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  return category;
}

async function ensureSlugIsAvailable(slug, excludedId = null) {
  const existingCategory = await Category.findBySlug(slug);

  if (existingCategory && existingCategory.id !== Number(excludedId)) {
    throw new HttpError(409, 'A category with that slug already exists');
  }
}

async function listCategories(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['name', 'slug', 'createdAt', 'updatedAt'],
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });
  const { items, total } = await Category.listAll(pagination);
  return buildPaginatedResponse(items, total, pagination);
}

async function getCategoryById(categoryId) {
  return ensureCategoryExists(categoryId);
}

async function createCategory(payload) {
  const name = validateName(payload.name);
  const slug = resolveSlug(name, payload.slug);
  const description = normalizeDescription(payload.description) ?? null;

  await ensureSlugIsAvailable(slug);

  return Category.create({ name, slug, description });
}

async function updateCategory(categoryId, payload) {
  const currentCategory = await ensureCategoryExists(categoryId);
  const updates = {};

  if (payload.name !== undefined) {
    updates.name = validateName(payload.name);
  }

  if (payload.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }

  if (payload.slug !== undefined || updates.name !== undefined) {
    const slugBase = updates.name !== undefined ? updates.name : currentCategory.name;
    updates.slug = resolveSlug(slugBase, payload.slug);
    await ensureSlugIsAvailable(updates.slug, currentCategory.id);
  }

  if (!Object.keys(updates).length) {
    throw new HttpError(400, 'No valid fields were provided for update');
  }

  return Category.update(categoryId, updates);
}

async function deleteCategory(categoryId) {
  await ensureCategoryExists(categoryId);

  try {
    await Category.remove(categoryId);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Cannot delete a category assigned to products');
    }

    throw error;
  }

  return { message: 'Category deleted successfully' };
}

module.exports = {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
};
