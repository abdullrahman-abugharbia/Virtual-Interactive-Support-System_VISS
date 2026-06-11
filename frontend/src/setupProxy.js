const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    ['/auth', '/products', '/brands', '/categories', '/cart', '/orders', '/users', '/create-payment-intent', '/admin', '/api'],
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};
