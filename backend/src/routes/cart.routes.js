const { Router } = require('express');
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  cartItemIdParamSchema,
  addToCartSchema,
  updateCartItemSchema,
} = require('../validators/cart.validator');

const router = Router();

router.use(requireAuth);

router.get('/', cartController.getMyCart);
router.post('/', validate({ body: addToCartSchema }), cartController.addToCart);
router.patch(
  '/:id',
  validate({ params: cartItemIdParamSchema, body: updateCartItemSchema }),
  cartController.updateCartItem
);
router.delete('/:id', validate({ params: cartItemIdParamSchema }), cartController.removeCartItem);

module.exports = router;
