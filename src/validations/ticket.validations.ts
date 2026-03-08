import { z } from 'zod';

export const ticketCreateSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(3, 'Title must be at least 3 characters'),
  description: z
    .string({ message: 'Description is required' })
    .min(5, 'Description must be at least 5 characters'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Invalid priority' })
    .optional(),
  propertyId: z.uuid({ message: 'Invalid property ID' }),
  unit: z.string({ message: 'Unit is required' }).min(1, 'Unit is required'),
  imageUrls: z.array(z.url({ message: 'Invalid URL' })).optional(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketListQuerySchema = z.object({
  status: z
    .enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE'], {
      message: 'Invalid status',
    })
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], { message: 'Invalid priority' })
    .optional(),
  propertyId: z.uuid({ message: 'Invalid UUID' }).optional(),
});

export const ticketAssignSchema = z.object({
  technicianId: z
    .uuid({ message: 'Invalid technician ID' }),
});

export type TicketAssignInput = z.infer<typeof ticketAssignSchema>;

export const ticketUpdateSchema = z
  .object({
    priority: z
      .enum(['LOW', 'MEDIUM', 'HIGH'], { message: 'Invalid priority' })
      .optional(),
    status: z
      .enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE'], {
        message: 'Invalid status',
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one of priority or status must be provided',
  });

export const ticketProgressSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'DONE'], { message: 'Invalid status' }),
});

export type TicketProgressInput = z.infer<typeof ticketProgressSchema>;

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
