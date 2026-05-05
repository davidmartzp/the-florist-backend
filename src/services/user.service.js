const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const AccessControl = require('../models/AccessControl');
const User = require('../models/User');
const HttpError = require('../utils/http-error');
const accessControlService = require('./access-control.service');
const { buildPaginatedResponse, parseListQuery } = require('../utils/list-query');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function validateEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new HttpError(400, 'email is required');
  }

  return normalizedEmail;
}

function validateName(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return String(value).trim();
}

function validatePassword(password, { required }) {
  if (!password) {
    if (required) {
      throw new HttpError(400, 'password is required');
    }

    return null;
  }

  if (String(password).length < 8) {
    throw new HttpError(400, 'password must contain at least 8 characters');
  }

  return String(password);
}

async function ensureUserExists(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
}

async function listUsers(query = {}) {
  const pagination = parseListQuery(query, {
    allowedSortBy: ['email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  const { items, total } = await User.listAll(pagination);

  const users = await Promise.all(items.map(accessControlService.buildUserAccessProfile));
  return buildPaginatedResponse(users, total, pagination);
}

async function getUserById(userId) {
  const user = await ensureUserExists(userId);
  return accessControlService.buildUserAccessProfile(user);
}

async function createUser(payload) {
  const email = validateEmail(payload.email);
  const firstName = validateName(payload.firstName, 'firstName');
  const lastName = validateName(payload.lastName, 'lastName');
  const password = validatePassword(payload.password, { required: true });
  const permissionCodes = await accessControlService.assertPermissionCodesExist(
    payload.permissions || []
  );

  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    throw new HttpError(409, 'A user with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const createdUser = await User.create(
      {
        email,
        firstName,
        lastName,
        passwordHash,
      },
      connection
    );

    await AccessControl.replaceUserPermissions(createdUser.id, permissionCodes, connection);
    await connection.commit();

    return getUserById(createdUser.id);
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'A user with that email already exists');
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function updateUser(userId, payload) {
  const currentUser = await ensureUserExists(userId);
  const updates = {};

  if (payload.email !== undefined) {
    const email = validateEmail(payload.email);
    const existingUser = await User.findByEmail(email);

    if (existingUser && existingUser.id !== currentUser.id) {
      throw new HttpError(409, 'A user with that email already exists');
    }

    updates.email = email;
  }

  if (payload.firstName !== undefined) {
    updates.firstName = validateName(payload.firstName, 'firstName');
  }

  if (payload.lastName !== undefined) {
    updates.lastName = validateName(payload.lastName, 'lastName');
  }

  if (payload.password !== undefined) {
    const password = validatePassword(payload.password, { required: true });
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  let permissionCodes = null;

  if (payload.permissions !== undefined) {
    permissionCodes = await accessControlService.assertPermissionCodesExist(payload.permissions);
  }

  if (!Object.keys(updates).length && permissionCodes === null) {
    throw new HttpError(400, 'No valid fields were provided for update');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await User.update(userId, updates, connection);

    if (permissionCodes !== null) {
      await AccessControl.replaceUserPermissions(userId, permissionCodes, connection);
    }

    await connection.commit();

    return getUserById(userId);
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'A user with that email already exists');
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function toggleUserActive(actorUserId, targetUserId) {
  const user = await ensureUserExists(targetUserId);

  if (Number(actorUserId) === Number(targetUserId)) {
    throw new HttpError(400, 'You cannot change your own account status');
  }

  if (user.isActive) {
    await User.deactivate(targetUserId);
  } else {
    await User.activate(targetUserId);
  }

  return getUserById(targetUserId);
}

async function getAccessControlCatalog() {
  return accessControlService.getAccessControlCatalog();
}

module.exports = {
  createUser,
  getAccessControlCatalog,
  getUserById,
  listUsers,
  toggleUserActive,
  updateUser,
};
