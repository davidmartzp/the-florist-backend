const siteCheckoutService = require('../services/site-checkout.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function createCheckoutPreference(req, res) {
  try {
    const preference = await siteCheckoutService.createCheckoutPreference(req.body);
    res.json(preference);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function confirmCheckout(req, res) {
  try {
    const result = await siteCheckoutService.confirmCheckoutPayment(req.body);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function receiveWebhook(req, res) {
  // Responder inmediatamente a MercadoPago (IPN requiere respuesta 200 rápida)
  res.status(200).send('OK');

  // Procesar en background después de responder
  try {
    await siteCheckoutService.processWebhook(req.body);
  } catch (error) {
    // Loggear error pero no afectar la respuesta HTTP
    // eslint-disable-next-line no-console
    console.error('Webhook processing error:', error.message);
  }
}

module.exports = {
  createCheckoutPreference,
  confirmCheckout,
  receiveWebhook,
};
