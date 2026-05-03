const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const accessControlService = require('./access-control.service');
const User = require('../models/User');
const HttpError = require('../utils/http-error');

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildResetTokenResponse(resetToken, expiresAt) {
  return {
    resetToken,
    expiresAt: expiresAt.toISOString(),
    resetUrl: `${env.appUrl}/reset-password?token=${resetToken}`,
  };
}

function toMysqlUtcDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await User.findByEmail(normalizeEmail(email));

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'User account is inactive');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const userAccessProfile = await accessControlService.buildUserAccessProfile(user);

  const token = jwt.sign(
    {
      id: user.id,
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: userAccessProfile.id,
      email: userAccessProfile.email,
      firstName: userAccessProfile.firstName,
      lastName: userAccessProfile.lastName,
      isActive: userAccessProfile.isActive,
      permissions: userAccessProfile.permissions,
    },
  };
}

async function requestPasswordReset({ email }) {
  if (!email) {
    throw new HttpError(400, 'Email is required');
  }

  const user = await User.findByEmail(normalizeEmail(email));
  const message = 'If the account exists, a password reset token has been generated';

  if (!user || !user.isActive) {
    return { message };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(
    Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000
  );

  await User.setPasswordResetToken(user.id, tokenHash, toMysqlUtcDateTime(expiresAt));

  return {
    message,
    ...buildResetTokenResponse(resetToken, expiresAt),
  };
}

async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    throw new HttpError(400, 'Token and newPassword are required');
  }

  if (newPassword.length < 8) {
    throw new HttpError(400, 'newPassword must contain at least 8 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findByResetTokenHash(tokenHash);

  if (!user) {
    throw new HttpError(400, 'Reset token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await User.updatePassword(user.id, passwordHash);

  return {
    message: 'Password updated successfully',
  };
}

async function getAuthenticatedUserContext(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new HttpError(403, 'User account is inactive or no longer exists');
  }

  const userAccessProfile = await accessControlService.buildUserAccessProfile(user);

  return {
    id: userAccessProfile.id,
    email: userAccessProfile.email,
    firstName: userAccessProfile.firstName,
    lastName: userAccessProfile.lastName,
    isActive: userAccessProfile.isActive,
    permissions: userAccessProfile.permissions,
  };
}

module.exports = {
  getAuthenticatedUserContext,
  login,
  requestPasswordReset,
  resetPassword,
};
