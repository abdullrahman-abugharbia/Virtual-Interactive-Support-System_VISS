const { z, idParamSchema, paginationQuerySchema } = require('./common.validator');

const orderAddressSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(3),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pinCode: z.string().min(1),
});

const createOrderSchema = z.object({
  paymentMethod: z.enum(['cash', 'card']),
  selectedAddress: orderAddressSchema,
  status: z.enum(['pending', 'dispatched', 'delivered', 'received', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'received', 'failed']).optional(),
  items: z.array(z.any()).optional(),
  totalAmount: z.coerce.number().optional(),
  totalItems: z.coerce.number().optional(),
  user: z.any().optional(),
});

const updateOrderSchema = z
  .object({
    status: z.enum(['pending', 'dispatched', 'delivered', 'received', 'cancelled']).optional(),
    paymentMethod: z.enum(['cash', 'card']).optional(),
    paymentStatus: z.enum(['pending', 'received', 'failed']).optional(),
    selectedAddress: orderAddressSchema.partial().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update order',
  });

module.exports = {
  orderIdParamSchema: idParamSchema,
  createOrderSchema,
  updateOrderSchema,
  orderListQuerySchema: paginationQuerySchema,
};
