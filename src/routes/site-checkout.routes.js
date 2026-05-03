const router = require('express').Router();
const controller = require('../controllers/site-checkout.controller');

router.post('/', controller.createCheckoutPreference);
router.post('/confirm', controller.confirmCheckout);
router.post('/webhook', controller.receiveWebhook);

module.exports = router;
