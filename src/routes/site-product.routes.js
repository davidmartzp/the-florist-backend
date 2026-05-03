const router = require('express').Router();
const controller = require('../controllers/site-product.controller');

router.get('/', controller.listSiteProducts);
router.get('/slug/:productSlug', controller.getSiteProductBySlug);
router.get('/:productId', controller.getSiteProduct);

module.exports = router;
