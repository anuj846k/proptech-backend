import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { units } from '../unit/unit.models';
import { users } from '../user/user.models';

export const ticketStatuses = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'DONE',
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const ticketPriorities = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatusEnum = pgEnum('ticket_status', ticketStatuses);
export const ticketPriorityEnum = pgEnum('ticket_priority', ticketPriorities);

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('OPEN'),
  priority: ticketPriorityEnum('priority').notNull(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id),
  technicianId: uuid('technician_id').references(() => users.id),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ticketImages = pgTable('ticket_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id),
  imageUrl: text('image_url').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});
