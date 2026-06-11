const { z } = require('zod');

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationQuerySchema = z.object({
  _page: z.string().optional(),
  _limit: z.string().optional(),
  _sort: z.string().optional(),
  _order: z.string().optional(),
});

module.exports = {
  z,
  idParamSchema,
  paginationQuerySchema,
};
