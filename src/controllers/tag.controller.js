const tagService = require('../services/tag.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function createTag(req, res) {
  try {
    const tag = await tagService.createTag(req.body);
    res.status(201).json(tag);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateTag(req, res) {
  try {
    const tag = await tagService.updateTag(req.params.tagId, req.body);
    res.json(tag);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function toggleTagActive(req, res) {
  try {
    const result = await tagService.toggleTagActive(req.params.tagId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createTag,
  toggleTagActive,
};
