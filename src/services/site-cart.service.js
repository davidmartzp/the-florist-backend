const Product = require('../models/Product');
const HttpError = require('../utils/http-error');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function findProductBySlug(slug) {
  const response = await Product.listAll({ pageSize: 1000, offset: 0 });
  return response.items.find((product) => slugify(product.name) === slug) || null;
}

function toSiteProduct(product) {
  return {
    id: product.id,
    slug: slugify(product.name),
    type: product.type || 'GENERAL',
    name: product.name,
    category: 'Complementos',
    categorySlug: 'complementos',
    categoryIds: [],
    categorySlugs: [],
    price: product.price,
    badge: '',
    stemCount: '',
    deliveryNote: '',
    description: product.description || '',
    image: product.image || '/assets/default.png',
    highlights: [],
  };
}

async function listSiteComplements(hasGeneral, limit = 5) {
  if (!hasGeneral) {
    return [];
  }

  const response = await Product.listAll({
    type: 'COMPLEMENT',
    inStock: true,
    pageSize: limit,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  return response.items.map(toSiteProduct);
}

async function validateCartItemAddition(productSlug, cartItemSlugs = []) {
  if (!productSlug) {
    throw new HttpError(400, 'productSlug is required');
  }

  const targetProduct = await findProductBySlug(productSlug);

  if (!targetProduct) {
    throw new HttpError(404, 'Product not found');
  }

  if (targetProduct.type !== 'COMPLEMENT') {
    return toSiteProduct(targetProduct);
  }

  if (targetProduct.stock <= 0) {
    throw new HttpError(400, 'Cannot add a complement product without available stock');
  }

  if (!Array.isArray(cartItemSlugs) || cartItemSlugs.length === 0) {
    throw new HttpError(400, 'Cannot add a complement product without a GENERAL product in the cart');
  }

  const allProducts = await Product.listAll({ pageSize: 1000, offset: 0 });
  const hasGeneral = cartItemSlugs.some((slug) => {
    const product = allProducts.items.find((item) => slugify(item.name) === slug);
    return product?.type === 'GENERAL';
  });

  if (!hasGeneral) {
    throw new HttpError(400, 'At least one GENERAL product must be present before adding a complement');
  }

  return toSiteProduct(targetProduct);
}

module.exports = {
  findProductBySlug,
  listSiteComplements,
  validateCartItemAddition,
};
