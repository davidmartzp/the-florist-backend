const categoryService = require('../services/category.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listCategories(req, res) {
  try {
    const categories = await categoryService.listCategories(req.query);
    res.json(categories);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getCategory(req, res) {
  try {
    const category = await categoryService.getCategoryById(req.params.categoryId);
    res.json(category);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const category = await categoryService.updateCategory(req.params.categoryId, req.body);
    res.json(category);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const result = await categoryService.deleteCategory(req.params.categoryId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
};
