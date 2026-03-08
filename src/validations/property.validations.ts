import { z } from 'zod';

export const propertyCreateSchema = z.object({
  name: z
    .string({ message: 'Property name is required' })
    .min(3, 'Property name must be at least 3 characters'),
  address: z
    .string({ message: 'Address is required' })
    .min(5, 'Address must be at least 5 characters'),
});

export const assignManagerSchema = z.object({
  managerId: z.uuid({ message: 'Invalid manager ID' }),
});

export type AssignManagerInput = z.infer<typeof assignManagerSchema>;

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
