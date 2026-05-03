const siteShippingMethodService = require('../services/site-shipping-method.service');

async function listSiteShippingMethods(_req, res) {
  const shippingMethods = await siteShippingMethodService.listSiteShippingMethods();
  res.json(shippingMethods);
}

module.exports = {
  listSiteShippingMethods,
};
