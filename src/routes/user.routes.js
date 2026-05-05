const router = require('express').Router();
const controller = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);

router.get(
  '/access-control',
  requirePermissions('USERS'),
  controller.getAccessControlCatalog
);

router.get('/', requirePermissions('USERS'), controller.listUsers);
router.get('/:userId', requirePermissions('USERS'), controller.getUser);
router.post('/', requirePermissions('USERS'), controller.createUser);
router.patch('/:userId', requirePermissions('USERS'), controller.updateUser);
router.patch(
  '/:userId/toggle-active',
  requirePermissions('USERS'),
  controller.toggleUserActive
);

module.exports = router;
