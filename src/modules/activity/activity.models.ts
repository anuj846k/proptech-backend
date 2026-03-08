import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { tickets } from '../ticket/ticket.models';
import { users } from '../user/user.models';

export const actionTypes = [
  'CREATED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'COMMENTED',
] as const;
export type ActionType = (typeof actionTypes)[number];

export const actionTypeEnum = pgEnum('action_type', actionTypes);

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id),
  actionType: actionTypeEnum('action_type').notNull(),
  performedBy: uuid('performed_by')
    .notNull()
    .references(() => users.id),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
});
