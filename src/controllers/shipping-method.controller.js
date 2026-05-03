const shippingMethodService = require('../services/shipping-method.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listShippingMethods(req, res) {
  try {
    const shippingMethods = await shippingMethodService.listShippingMethods(req.query);
    res.json(shippingMethods);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getShippingMethod(req, res) {
  try {
    const shippingMethod = await shippingMethodService.getShippingMethodById(req.params.shippingMethodId);
    res.json(shippingMethod);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createShippingMethod(req, res) {
  try {
    const shippingMethod = await shippingMethodService.createShippingMethod(req.body);
    res.status(201).json(shippingMethod);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateShippingMethod(req, res) {
  try {
    const shippingMethod = await shippingMethodService.updateShippingMethod(req.params.shippingMethodId, req.body);
    res.json(shippingMethod);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function deleteShippingMethod(req, res) {
  try {
    const result = await shippingMethodService.deleteShippingMethod(req.params.shippingMethodId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createShippingMethod,
  deleteShippingMethod,
  getShippingMethod,
  listShippingMethods,
  updateShippingMethod,
};
