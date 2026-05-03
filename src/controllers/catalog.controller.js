const catalogService = require('../services/catalog.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listCatalogs(req, res) {
  try {
    const catalogs = await catalogService.listCatalogs(req.query);
    res.json(catalogs);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getCatalog(req, res) {
  try {
    const catalog = await catalogService.getCatalogById(req.params.catalogId);
    res.json(catalog);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createCatalog(req, res) {
  try {
    const catalog = await catalogService.createCatalog(req.body);
    res.status(201).json(catalog);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateCatalog(req, res) {
  try {
    const catalog = await catalogService.updateCatalog(req.params.catalogId, req.body);
    res.json(catalog);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function deleteCatalog(req, res) {
  try {
    const result = await catalogService.deleteCatalog(req.params.catalogId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createCatalog,
  deleteCatalog,
  getCatalog,
  listCatalogs,
  updateCatalog,
};
