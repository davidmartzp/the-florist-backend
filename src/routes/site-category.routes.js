const router = require('express').Router();
const controller = require('../controllers/site-category.controller');

router.get('/', controller.listSiteCategories);

module.exports = router;
