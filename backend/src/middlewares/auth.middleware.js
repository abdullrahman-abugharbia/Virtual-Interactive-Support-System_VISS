const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');
const { extractTokenFromRequest, verifyToken } = require('../services/token.service');

async function hydrateAuth(req, strict = true) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    if (strict) {
      throw new ApiError(401, 'Authentication token is required');
    }
    return null;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    if (strict) {
      throw new ApiError(401, 'Invalid or expired authentication token');
    }
    return null;
  }

  const userId = Number(payload.sub);
  if (!userId) {
    throw new ApiError(401, 'Invalid authentication token payload');
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(401, 'User not found for token');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is deactivated');
  }

  req.auth = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  req.user = user;

  return req.auth;
}

async function requireAuth(req, res, next) {
  try {
    await hydrateAuth(req, true);
    next();
  } catch (error) {
    next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    await hydrateAuth(req, false);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
};
