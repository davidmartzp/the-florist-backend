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

  // Soporta formato webhook (JSON body) e IPN (query params: topic=payment&id=...)
  const payload = { ...req.query, ...req.body };

  // eslint-disable-next-line no-console
  console.log('[Webhook] received body=%j query=%j', req.body, req.query);

  try {
    const result = await siteCheckoutService.processWebhook(payload);
    // eslint-disable-next-line no-console
    console.log('[Webhook] result=%j', result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Webhook] error: %s\n%s', error.message, error.stack);
  }
}

module.exports = {
  createCheckoutPreference,
  confirmCheckout,
  receiveWebhook,
};
