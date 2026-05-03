module.exports = (...requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user && Array.isArray(req.user.permissions)
      ? req.user.permissions
      : [];

    const missingPermissions = requiredPermissions.filter(
      (permission) => !userPermissions.includes(permission)
    );

    if (missingPermissions.length) {
      return res.status(403).json({
        error: `Missing required permissions: ${missingPermissions.join(', ')}`,
      });
    }

    next();
  };
};
