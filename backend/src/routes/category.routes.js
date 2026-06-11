const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/category.validator');

const router = Router();

router.get('/', categoryController.listCategories);
router.get('/:id', validate({ params: categoryIdParamSchema }), categoryController.getCategoryById);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate({ body: createCategorySchema }),
  categoryController.createCategory
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: categoryIdParamSchema }),
  categoryController.deleteCategory
);

module.exports = router;
