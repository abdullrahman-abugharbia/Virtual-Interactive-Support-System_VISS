const { z, idParamSchema } = require('./common.validator');

const addToCartSchema = z.object({
  product: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(99).default(1),
  color: z.any().optional(),
  size: z.any().optional(),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().max(99).optional(),
  color: z.any().optional(),
  size: z.any().optional(),
});

module.exports = {
  cartItemIdParamSchema: idParamSchema,
  addToCartSchema,
  updateCartItemSchema,
};
