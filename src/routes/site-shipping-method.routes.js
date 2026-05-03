const express = require('express');
const siteShippingMethodController = require('../controllers/site-shipping-method.controller');

const router = express.Router();

router.get('/', siteShippingMethodController.listSiteShippingMethods);

module.exports = router;
