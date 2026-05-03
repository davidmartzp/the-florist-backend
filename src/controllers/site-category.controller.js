const siteCategoryService = require('../services/site-category.service');

async function listSiteCategories(req, res) {
  try {
    const categories = await siteCategoryService.listSiteCategories();
    res.json(categories);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  listSiteCategories,
};
