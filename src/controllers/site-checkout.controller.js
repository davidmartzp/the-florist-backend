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
  res.status(200).send('OK');

  const payload = { ...req.query, ...req.body };

  try {
    await siteCheckoutService.processWebhook(payload, req.headers);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Webhook] error: %s', error.message);
  }
}

module.exports = {
  createCheckoutPreference,
  confirmCheckout,
  receiveWebhook,
};
