const { z, idParamSchema, paginationQuerySchema } = require('./common.validator');

const freeJsonArray = z.array(z.any());

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().nonnegative(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  discountPrice: z.coerce.number().nonnegative().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  stock: z.coerce.number().int().nonnegative(),
  brand: z.string().min(1),
  category: z.string().min(1),
  thumbnail: z.string().url().or(z.string().min(1)).optional(),
  images: freeJsonArray.optional().default([]),
  highlights: freeJsonArray.optional().default([]),
  colors: freeJsonArray.optional().default([]),
  sizes: freeJsonArray.optional().default([]),
  deleted: z.boolean().optional().default(false),
});

const updateProductSchema = createProductSchema.partial();

const productListQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  admin: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

module.exports = {
  productIdParamSchema: idParamSchema,
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
};
