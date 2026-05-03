const router = require('express').Router();
const controller = require('../controllers/order.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('ORDERS'));

router.get('/', controller.listOrders);
router.get('/:orderId', controller.getOrder);
router.post('/', controller.createOrder);
router.patch('/:orderId', controller.updateOrder);
router.delete('/:orderId', controller.deleteOrder);

module.exports = router;
