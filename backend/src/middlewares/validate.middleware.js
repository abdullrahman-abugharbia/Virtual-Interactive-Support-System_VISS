const ApiError = require('../utils/ApiError');

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (error) {
      next(
        new ApiError(422, 'Validation failed', {
          issues: error.issues || error.message,
        })
      );
    }
  };
}

module.exports = { validate };
