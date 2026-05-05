const router = require('express').Router();
const controller = require('../controllers/catalog.controller');
const auth = require('../middlewares/auth');
const requirePermissions = require('../middlewares/require-permissions');

router.use(auth);
router.use(requirePermissions('PRODUCTS'));

router.get('/', controller.listCatalogs);
router.get('/:catalogId', controller.getCatalog);
router.post('/', controller.createCatalog);
router.patch('/:catalogId', controller.updateCatalog);
router.patch('/:catalogId/toggle-active', controller.toggleCatalogActive);

module.exports = router;

