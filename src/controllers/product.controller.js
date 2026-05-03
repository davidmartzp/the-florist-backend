const productService = require('../services/product.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listProducts(req, res) {
  try {
    const products = await productService.listProductsWithFilters(req.query);
    res.json(products);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getProduct(req, res) {
  try {
    const product = await productService.getProductById(req.params.productId);
    res.json(product);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function listProductPriceHistory(req, res) {
  try {
    const history = await productService.listProductPriceHistory(req.params.productId);
    res.json(history);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await productService.updateProduct(req.params.productId, req.body);
    res.json(product);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const result = await productService.deleteProduct(req.params.productId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  getProduct,
  listProductPriceHistory,
  listProducts,
  updateProduct,
};
