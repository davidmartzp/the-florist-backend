const productService = require('../services/product.service');

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toSiteProduct(product) {
  const categories = Array.isArray(product.categories) ? product.categories : [];
  const category = categories.length ? categories[0] : null;
  const type = String(product.type || 'GENERAL').toUpperCase();

  return {
    id: product.id,
    slug: product.slug || slugify(product.name),
    name: product.name,
    type,
    categories: categories.map((categoryItem) => ({
      id: categoryItem.id,
      name: categoryItem.name,
      slug: categoryItem.slug,
      description: categoryItem.description,
    })),
    category: category ? category.name : null,
    categorySlug: category ? category.slug : null,
    price: product.price,
    badge: null,
    stemCount: null,
    deliveryNote: null,
    description: product.description,
    image: product.image,
    highlights: [],
  };
}

async function listSiteProducts(req, res) {
  try {
    const query = {
      ...req.query,
      type: 'GENERAL',
    };

    const response = await productService.listProductsWithFilters(query);
    const mappedItems = response.items.map(toSiteProduct);
    const mapped = { ...response, items: mappedItems, total: mappedItems.length };
    res.json(mapped);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function getSiteProduct(req, res) {
  try {
    const product = await productService.getProductById(req.params.productId);

    if (product.type === 'COMPLEMENT') {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(toSiteProduct(product));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function getSiteProductBySlug(req, res) {
  try {
    const product = await productService.getProductBySlug(req.params.productSlug);
    res.json(toSiteProduct(product));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listSiteProducts, getSiteProduct, getSiteProductBySlug };
