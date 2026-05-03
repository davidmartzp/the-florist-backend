const authService = require('../services/auth.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.requestPasswordReset(req.body);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
};

