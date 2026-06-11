const { z, idParamSchema } = require('./common.validator');

const addressSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(3),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pinCode: z.string().min(1),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(1).max(120).optional(),
    role: z.enum(['user', 'admin']).optional(),
    isActive: z.boolean().optional(),
    addresses: z.array(addressSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update user',
  });

module.exports = {
  userIdParamSchema: idParamSchema,
  updateUserSchema,
};
