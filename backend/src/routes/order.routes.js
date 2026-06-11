const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  orderIdParamSchema,
  createOrderSchema,
  updateOrderSchema,
  orderListQuerySchema,
} = require('../validators/order.validator');

const router = Router();

router.use(requireAuth);

router.post('/', validate({ body: createOrderSchema }), orderController.createOrder);
router.get('/own', orderController.getMyOrders);

router.get(
  '/',
  requireRole('admin'),
  validate({ query: orderListQuerySchema }),
  orderController.getAllOrders
);

router.get('/:id', validate({ params: orderIdParamSchema }), orderController.getOrderById);

router.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: orderIdParamSchema, body: updateOrderSchema }),
  orderController.updateOrder
);

module.exports = router;
