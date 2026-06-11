const { z, idParamSchema } = require('./common.validator');

const createCategorySchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional().nullable(),
});

const updateCategorySchema = createCategorySchema.partial();

module.exports = {
  categoryIdParamSchema: idParamSchema,
  createCategorySchema,
  updateCategorySchema,
};
