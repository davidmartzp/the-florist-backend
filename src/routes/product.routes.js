const router = require('express').Router();
const controller = require('../controllers/product.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('PRODUCTS'));

router.get('/', controller.listProducts);
router.get('/:productId/price-history', controller.listProductPriceHistory);
router.get('/:productId', controller.getProduct);
router.post('/', controller.createProduct);
router.patch('/:productId', controller.updateProduct);
router.patch('/:productId/toggle-active', controller.toggleProductActive);

module.exports = router;
