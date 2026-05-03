const express = require('express');
const siteCartController = require('../controllers/site-cart.controller');

const router = express.Router();

router.get('/complements', siteCartController.listComplements);
router.post('/items', siteCartController.validateCartItem);

module.exports = router;
