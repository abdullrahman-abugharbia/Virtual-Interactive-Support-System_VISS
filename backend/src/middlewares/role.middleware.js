const ApiError = require('../utils/ApiError');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(new ApiError(403, 'You are not allowed to access this resource'));
    }

    return next();
  };
}

module.exports = { requireRole };
