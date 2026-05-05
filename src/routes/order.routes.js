const router = require('express').Router();
const controller = require('../controllers/order.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('ORDERS'));

router.get('/', controller.listOrders);
router.get('/export', controller.exportOrders);
router.get('/:orderId', controller.getOrder);
router.post('/', controller.createOrder);
router.patch('/:orderId', controller.updateOrder);
router.patch('/:orderId/toggle-active', controller.toggleOrderActive);

module.exports = router;
