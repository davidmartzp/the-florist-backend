const router = require('express').Router();
const controller = require('../controllers/category.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('PRODUCTS'));

router.get('/', controller.listCategories);
router.get('/:categoryId', controller.getCategory);
router.post('/', controller.createCategory);
router.patch('/:categoryId', controller.updateCategory);
router.patch('/:categoryId/toggle-active', controller.toggleCategoryActive);

module.exports = router;

