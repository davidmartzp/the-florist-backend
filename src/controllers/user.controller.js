const userService = require('../services/user.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listUsers(req, res) {
  try {
    const users = await userService.listUsers(req.query);
    res.json(users);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getUser(req, res) {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.json(user);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const user = await userService.updateUser(req.params.userId, req.body);
    res.json(user);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function toggleUserActive(req, res) {
  try {
    const user = await userService.toggleUserActive(req.user.id, req.params.userId);
    res.json(user);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getAccessControlCatalog(_req, res) {
  try {
    const catalog = await userService.getAccessControlCatalog();
    res.json(catalog);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createUser,
  getAccessControlCatalog,
  getUser,
  listUsers,
  toggleUserActive,
  updateUser,
};
