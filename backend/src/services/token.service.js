const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { signToken, verifyToken } = require('../utils/jwt');

function parseDurationToMs(durationText) {
  const value = String(durationText || '').trim();
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMap[unit];
}

function buildAuthPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function issueAccessToken(userPayload) {
  return signToken({
    sub: userPayload.id,
    email: userPayload.email,
    role: userPayload.role,
  });
}

function issuePasswordResetToken(email) {
  return jwt.sign(
    {
      email,
      action: 'reset-password',
    },
    env.jwtSecret,
    { expiresIn: '15m' }
  );
}

function verifyPasswordResetToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function setAuthCookie(res, token) {
  const maxAge = parseDurationToMs(env.jwtExpiresIn);

  res.cookie(env.jwtCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.jwtCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
  });
}

function extractTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.cookies && req.cookies[env.jwtCookieName]) {
    return req.cookies[env.jwtCookieName];
  }

  return null;
}

module.exports = {
  buildAuthPayload,
  issueAccessToken,
  issuePasswordResetToken,
  verifyPasswordResetToken,
  setAuthCookie,
  clearAuthCookie,
  extractTokenFromRequest,
  verifyToken,
};
