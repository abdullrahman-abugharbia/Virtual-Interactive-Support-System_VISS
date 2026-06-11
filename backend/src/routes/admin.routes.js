const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { userIdParamSchema, updateUserSchema } = require('../validators/user.validator');
const { orderIdParamSchema, updateOrderSchema } = require('../validators/order.validator');
const { paginationQuerySchema } = require('../validators/common.validator');

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', validate({ query: paginationQuerySchema }), adminController.listUsers);
router.patch('/users/:id', validate({ params: userIdParamSchema, body: updateUserSchema }), adminController.updateUserByAdmin);

router.get('/orders', validate({ query: paginationQuerySchema }), adminController.listOrders);
router.patch(
  '/orders/:id',
  validate({ params: orderIdParamSchema, body: updateOrderSchema }),
  adminController.updateOrderByAdmin
);

module.exports = router;
