const siteCartService = require('../services/site-cart.service');

async function listComplements(req, res) {
  try {
    const hasGeneral = req.query.hasGeneral === '1' || req.query.hasGeneral === 'true';
    const complements = await siteCartService.listSiteComplements(hasGeneral, 5);
    res.json(complements);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function validateCartItem(req, res) {
  try {
    const { productSlug, cartItemSlugs } = req.body;
    const product = await siteCartService.validateCartItemAddition(productSlug, cartItemSlugs);
    res.json(product);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  listComplements,
  validateCartItem,
};
