const { pool } = require('../config/db');
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductPriceHistory = require('../models/ProductPriceHistory');
const Tag = require('../models/Tag');
const HttpError = require('../utils/http-error');
const { buildPaginatedResponse, parseListQuery } = require('../utils/list-query');

function validateName(name) {
  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    throw new HttpError(400, 'name is required');
  }

  return normalizedName;
}

function validatePrice(price) {
  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    throw new HttpError(400, 'price must be a number greater than 0');
  }

  return normalizedPrice;
}

function validateStock(stock) {
  const normalizedStock = Number(stock);

  if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
    throw new HttpError(400, 'stock must be an integer greater than or equal to 0');
  }

  return normalizedStock;
}

function validateHasVat(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  throw new HttpError(400, 'hasVat must be true or false');
}

function validateVatRate(value) {
  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0 || normalizedValue > 100) {
    throw new HttpError(400, 'vatRate must be a number between 0 and 100');
  }

  return Number(normalizedValue.toFixed(2));
}

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

function validateProductType(value) {
  if (value === undefined || value === null) {
    return 'GENERAL';
  }

  const normalizedValue = String(value).trim().toUpperCase();

  if (!['GENERAL', 'COMPLEMENT', 'MEMBERSHIP'].includes(normalizedValue)) {
    throw new HttpError(400, 'type must be GENERAL, COMPLEMENT, or MEMBERSHIP');
  }

  return normalizedValue;
}

function normalizeSearch(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  return normalizedValue || undefined;
}

function normalizeIdArray(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, `${fieldName} must be an array`);
  }

  const normalizedIds = value.map((item) => Number(item));
  const invalidIds = normalizedIds.filter((item) => !Number.isInteger(item) || item <= 0);

  if (invalidIds.length) {
    throw new HttpError(400, `${fieldName} must contain only positive integer ids`);
  }

  return [...new Set(normalizedIds)];
}

function normalizeFilterIdList(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  const rawItems = Array.isArray(value) ? value : String(value).split(',');
  const normalizedIds = rawItems
    .map((item) => Number(String(item).trim()))
    .filter((item) => !Number.isNaN(item));

  const invalidIds = normalizedIds.filter((item) => !Number.isInteger(item) || item <= 0);

  if (
    invalidIds.length ||
    rawItems.some((item) => String(item).trim() === '') ||
    normalizedIds.length !== rawItems.length
  ) {
    throw new HttpError(400, `${fieldName} must contain only positive integer ids`);
  }

  return [...new Set(normalizedIds)];
}

function normalizeFilterNumber(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    throw new HttpError(400, `${fieldName} must be a number greater than or equal to 0`);
  }

  return normalizedValue;
}

function normalizeInStock(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === true || value === 'true' || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === '0') {
    return false;
  }

  throw new HttpError(400, 'inStock must be true, false, 1, or 0');
}

async function assertIdsExist(ids, model, entityName) {
  if (!ids.length) {
    return [];
  }

  const records = await model.listByIds(ids);
  const foundIds = new Set(records.map((record) => record.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  if (missingIds.length) {
    throw new HttpError(400, `Unknown ${entityName} ids: ${missingIds.join(', ')}`);
  }

  return records;
}

function attachRelations(products, categories, tags, catalogs) {
  const categoriesByProductId = new Map();
  const tagsByProductId = new Map();
  const catalogsByProductId = new Map();

  for (const category of categories) {
    const productCategories = categoriesByProductId.get(category.productId) || [];
    productCategories.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
    categoriesByProductId.set(category.productId, productCategories);
  }

  for (const tag of tags) {
    const productTags = tagsByProductId.get(tag.productId) || [];
    productTags.push({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
    tagsByProductId.set(tag.productId, productTags);
  }

  for (const catalog of catalogs) {
    const productCatalogs = catalogsByProductId.get(catalog.productId) || [];
    productCatalogs.push({
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      isActive: catalog.isActive,
      createdAt: catalog.createdAt,
      updatedAt: catalog.updatedAt,
    });
    catalogsByProductId.set(catalog.productId, productCatalogs);
  }

  return products.map((product) => ({
    ...product,
    categories: categoriesByProductId.get(product.id) || [],
    tags: tagsByProductId.get(product.id) || [],
    catalogs: catalogsByProductId.get(product.id) || [],
  }));
}

async function hydrateProducts(products, connection) {
  const productIds = products.map((product) => product.id);
  const [categories, tags, catalogs] = await Promise.all([
    Product.listCategoriesForProductIds(productIds, connection),
    Product.listTagsForProductIds(productIds, connection),
    Product.listCatalogsForProductIds(productIds, connection),
  ]);

  return attachRelations(products, categories, tags, catalogs);
}

async function ensureProductExists(productId) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new HttpError(404, 'Product not found');
  }

  return product;
}

function hasPricingChanges(currentProduct, updates) {
  return (
    updates.price !== undefined ||
    updates.hasVat !== undefined ||
    updates.vatRate !== undefined
  ) && (
    (updates.price !== undefined && updates.price !== currentProduct.price) ||
    (updates.hasVat !== undefined && updates.hasVat !== currentProduct.hasVat) ||
    (updates.vatRate !== undefined && updates.vatRate !== currentProduct.vatRate)
  );
}

async function createPriceHistorySnapshot(product, changeType, connection) {
  await ProductPriceHistory.create(
    {
      productId: product.id,
      price: product.price,
      hasVat: product.hasVat,
      vatRate: product.vatRate,
      changeType,
    },
    connection
  );
}

async function listProducts() {
  const pagination = parseListQuery({}, {
    allowedSortBy: ['name', 'price', 'vatRate', 'stock', 'createdAt', 'updatedAt'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  const { items, total } = await Product.listAll(pagination);
  const products = await hydrateProducts(items);
  return buildPaginatedResponse(products, total, pagination);
}

async function listProductsWithFilters(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['name', 'price', 'vatRate', 'stock', 'createdAt', 'updatedAt'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  const filters = {
    search: normalizeSearch(query.q),
    minPrice: normalizeFilterNumber(query.minPrice, 'minPrice'),
    maxPrice: normalizeFilterNumber(query.maxPrice, 'maxPrice'),
    inStock: normalizeInStock(query.inStock),
    categoryIds: normalizeFilterIdList(query.categoryIds, 'categoryIds'),
    tagIds: normalizeFilterIdList(query.tagIds, 'tagIds'),
    catalogIds: normalizeFilterIdList(query.catalogIds, 'catalogIds'),
    isActive: query.isActive !== undefined ? query.isActive !== 'false' && query.isActive !== false && query.isActive !== 0 : undefined,
    ...pagination,
  };

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    throw new HttpError(400, 'minPrice cannot be greater than maxPrice');
  }

  const { items, total } = await Product.listAll(filters);
  const products = await hydrateProducts(items);
  return buildPaginatedResponse(products, total, pagination);
}

async function getProductById(productId) {
  const product = await ensureProductExists(productId);
  const [hydratedProduct] = await hydrateProducts([product]);
  return hydratedProduct;
}

async function getProductBySlug(productSlug) {
  const product = await Product.findBySlug(productSlug);

  if (!product) {
    throw new HttpError(404, 'Product not found');
  }

  const [hydratedProduct] = await hydrateProducts([product]);
  return hydratedProduct;
}

async function listProductPriceHistory(productId) {
  await ensureProductExists(productId);
  return ProductPriceHistory.listByProductId(productId);
}

async function createProduct(payload) {
  const name = validateName(payload.name);
  const price = validatePrice(payload.price);
  const hasVat = payload.hasVat === undefined ? true : validateHasVat(payload.hasVat);
  const vatRate = payload.vatRate === undefined ? 19 : validateVatRate(payload.vatRate);
  const stock = validateStock(payload.stock);
  const type = validateProductType(payload.type);
  const description = normalizeOptionalText(payload.description) ?? null;
  const image = normalizeOptionalText(payload.image) ?? null;
  const categoryIds = normalizeIdArray(payload.categoryIds, 'categoryIds') || [];
  const tagIds = normalizeIdArray(payload.tagIds, 'tagIds') || [];
  const catalogIds = normalizeIdArray(payload.catalogIds, 'catalogIds') || [];

  await Promise.all([
    assertIdsExist(categoryIds, Category, 'category'),
    assertIdsExist(tagIds, Tag, 'tag'),
    assertIdsExist(catalogIds, Catalog, 'catalog'),
  ]);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const createdProduct = await Product.create(
      { name, price, hasVat, vatRate, stock, description, image, type },
      connection
    );
    await createPriceHistorySnapshot(createdProduct, 'created', connection);

    await Promise.all([
      Product.replaceCategories(createdProduct.id, categoryIds, connection),
      Product.replaceTags(createdProduct.id, tagIds, connection),
      Product.replaceCatalogs(createdProduct.id, catalogIds, connection),
    ]);

    await connection.commit();

    return getProductById(createdProduct.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateProduct(productId, payload) {
  const currentProduct = await ensureProductExists(productId);

  const updates = {};
  const categoryIds = normalizeIdArray(payload.categoryIds, 'categoryIds');
  const tagIds = normalizeIdArray(payload.tagIds, 'tagIds');
  const catalogIds = normalizeIdArray(payload.catalogIds, 'catalogIds');

  if (payload.name !== undefined) {
    updates.name = validateName(payload.name);
  }

  if (payload.price !== undefined) {
    updates.price = validatePrice(payload.price);
  }

  if (payload.hasVat !== undefined) {
    updates.hasVat = validateHasVat(payload.hasVat);
  }

  if (payload.vatRate !== undefined) {
    updates.vatRate = validateVatRate(payload.vatRate);
  }

  if (payload.stock !== undefined) {
    updates.stock = validateStock(payload.stock);
  }

  if (payload.description !== undefined) {
    updates.description = normalizeOptionalText(payload.description);
  }

  if (payload.image !== undefined) {
    updates.image = normalizeOptionalText(payload.image);
  }

  if (payload.type !== undefined) {
    updates.type = validateProductType(payload.type);
  }

  await Promise.all([
    categoryIds !== undefined ? assertIdsExist(categoryIds, Category, 'category') : Promise.resolve(),
    tagIds !== undefined ? assertIdsExist(tagIds, Tag, 'tag') : Promise.resolve(),
    catalogIds !== undefined ? assertIdsExist(catalogIds, Catalog, 'catalog') : Promise.resolve(),
  ]);

  if (
    !Object.keys(updates).length &&
    categoryIds === undefined &&
    tagIds === undefined &&
    catalogIds === undefined
  ) {
    throw new HttpError(400, 'No valid fields were provided for update');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updatedProduct = await Product.update(productId, updates, connection);

    if (hasPricingChanges(currentProduct, updates)) {
      await createPriceHistorySnapshot(updatedProduct, 'updated', connection);
    }

    if (categoryIds !== undefined) {
      await Product.replaceCategories(productId, categoryIds, connection);
    }

    if (tagIds !== undefined) {
      await Product.replaceTags(productId, tagIds, connection);
    }

    if (catalogIds !== undefined) {
      await Product.replaceCatalogs(productId, catalogIds, connection);
    }

    await connection.commit();

    return getProductById(productId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteProduct(productId) {
  await ensureProductExists(productId);
  await Product.remove(productId);
  return { message: 'Product deleted successfully' };
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  listProductPriceHistory,
  listProductsWithFilters,
  updateProduct,
};
