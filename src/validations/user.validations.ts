import { z } from 'zod';
import { ALLOWED_USER_ROLES, type UserRole } from '#modules/user/user.types';

export const userSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  email: z.email({ message: 'Invalid email address' }),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  phone: z
    .string({ message: 'Phone must be a string' })
    .regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
    .optional()
    .or(z.literal('')),
  role: z.enum(ALLOWED_USER_ROLES as [UserRole, ...UserRole[]], {
    message: 'Valid role is required',
  }),
});

export type UserCreateInput = z.infer<typeof userSchema>;

export const updateUserSchema = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .min(1, 'Name is required')
      .optional(),
    phone: z
      .string({ message: 'Phone must be a string' })
      .regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
      .optional(),
    role: z
      .enum(ALLOWED_USER_ROLES as [UserRole, ...UserRole[]], {
        message: 'Valid role is required',
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
