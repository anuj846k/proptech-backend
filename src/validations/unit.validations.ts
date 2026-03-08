import { z } from 'zod';

export const createUnitSchema = z.object({
  unitNumber: z
    .string({ message: 'Unit number is required' })
    .min(1, 'Unit number is required'),
  floor: z
    .number({ message: 'Floor must be a number' })
    .int()
    .min(0, 'Floor must be 0 or greater'),
  tenantId: z.uuid({ message: 'Invalid tenant ID' }).optional().nullable(),
});

export const assignTenantSchema = z.object({
  tenantId: z.uuid({ message: 'Invalid tenant ID' }).nullable(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type AssignTenantInput = z.infer<typeof assignTenantSchema>;
