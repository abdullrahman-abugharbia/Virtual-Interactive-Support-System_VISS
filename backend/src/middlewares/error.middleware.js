function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Resource already exists',
      details: err.detail || null,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      message: 'Invalid reference to related resource',
      details: err.detail || null,
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({
      message: 'Invalid value format',
      details: err.message,
    });
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler };
