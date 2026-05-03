const jwt = require('jsonwebtoken');
const env = require('../config/env');
const authService = require('../services/auth.service');

module.exports = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.sendStatus(401);
  }

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = await authService.getAuthenticatedUserContext(decoded.id);
    next();
  } catch (error) {
    const statusCode = error.name === 'JsonWebTokenError' ? 403 : (error.statusCode || 500);
    res.status(statusCode).json({ error: error.message || 'Forbidden' });
  }
};
