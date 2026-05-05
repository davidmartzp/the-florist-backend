const router = require('express').Router();
const controller = require('../controllers/tag.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('PRODUCTS'));

router.post('/', controller.createTag);
router.patch('/:tagId/toggle-active', controller.toggleTagActive);

module.exports = router;
