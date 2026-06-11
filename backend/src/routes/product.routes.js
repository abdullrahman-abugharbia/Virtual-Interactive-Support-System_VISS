const { Router } = require('express');
const productController = require('../controllers/product.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  productIdParamSchema,
} = require('../validators/product.validator');

const router = Router();

router.get('/', validate({ query: productListQuerySchema }), productController.getProducts);
router.get('/brands', productController.getBrands);
router.get('/:id', validate({ params: productIdParamSchema }), productController.getProductById);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate({ body: createProductSchema }),
  productController.createProduct
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.updateProduct
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: productIdParamSchema }),
  productController.deleteProduct
);

module.exports = router;
