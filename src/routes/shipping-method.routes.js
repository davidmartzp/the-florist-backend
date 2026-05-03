const router = require('express').Router();
const controller = require('../controllers/shipping-method.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('ORDERS'));

router.get('/', controller.listShippingMethods);
router.get('/:shippingMethodId', controller.getShippingMethod);
router.post('/', controller.createShippingMethod);
router.patch('/:shippingMethodId', controller.updateShippingMethod);
router.delete('/:shippingMethodId', controller.deleteShippingMethod);

module.exports = router;
