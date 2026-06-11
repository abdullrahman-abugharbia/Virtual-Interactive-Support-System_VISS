const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const userModel = require('../models/user.model');
const cartModel = require('../models/cart.model');
const {
  buildAuthPayload,
  issueAccessToken,
  issuePasswordResetToken,
  verifyPasswordResetToken,
} = require('./token.service');

async function registerUser({ email, password, name = null }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({
    email: normalizedEmail,
    passwordHash,
    name,
    role: 'user',
    addresses: [],
  });

  await cartModel.getOrCreateCart(user.id);

  const payload = buildAuthPayload(user);
  const token = issueAccessToken(payload);

  return {
    user: payload,
    token,
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await cartModel.getOrCreateCart(user.id);

  const payload = buildAuthPayload(user);
  const token = issueAccessToken(payload);

  return {
    user: payload,
    token,
  };
}

async function checkAuth(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(401, 'Session is invalid');
  }

  return buildAuthPayload(user);
}

async function requestPasswordReset(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await userModel.findByEmail(normalizedEmail);

  // Keep response generic regardless of user existence.
  if (!user) {
    return {
      message: 'If this email is registered, a password reset link has been generated.',
    };
  }

  const token = issuePasswordResetToken(user.email);

  return {
    message: 'Password reset token generated.',
    token,
    email: user.email,
  };
}

async function resetPassword({ email, token, password }) {
  let payload;
  try {
    payload = verifyPasswordResetToken(token);
  } catch (error) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (payload.action !== 'reset-password' || payload.email !== normalizedEmail) {
    throw new ApiError(400, 'Invalid password reset request');
  }

  const user = await userModel.findByEmail(normalizedEmail);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const passwordHash = await hashPassword(password);
  await userModel.updatePasswordByEmail(normalizedEmail, passwordHash);

  return {
    message: 'Password has been reset successfully',
  };
}

module.exports = {
  registerUser,
  loginUser,
  checkAuth,
  requestPasswordReset,
  resetPassword,
};
