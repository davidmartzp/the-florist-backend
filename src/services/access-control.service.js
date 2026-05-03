const AccessControl = require('../models/AccessControl');
const HttpError = require('../utils/http-error');

function normalizePermissionCodes(permissionCodes = []) {
  if (!Array.isArray(permissionCodes)) {
    throw new HttpError(400, 'permissions must be an array');
  }

  return [...new Set(permissionCodes.map((code) => String(code).trim()).filter(Boolean))];
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    deactivatedAt: user.deactivatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function assertPermissionCodesExist(permissionCodes) {
  const normalizedCodes = normalizePermissionCodes(permissionCodes);

  if (!normalizedCodes.length) {
    return normalizedCodes;
  }

  const permissions = await AccessControl.listPermissionsByCodes(normalizedCodes);
  const foundCodes = new Set(permissions.map((permission) => permission.code));
  const unknownCodes = normalizedCodes.filter((code) => !foundCodes.has(code));

  if (unknownCodes.length) {
    throw new HttpError(400, `Unknown permissions: ${unknownCodes.join(', ')}`);
  }

  return normalizedCodes;
}

async function buildUserAccessProfile(user) {
  if (!user) {
    return null;
  }

  const permissions = await AccessControl.listPermissionCodesForUser(user.id);

  return {
    ...serializeUser(user),
    permissions,
  };
}

async function getAccessControlCatalog() {
  return {
    permissions: await AccessControl.listPermissions(),
  };
}

module.exports = {
  assertPermissionCodesExist,
  buildUserAccessProfile,
  getAccessControlCatalog,
};
