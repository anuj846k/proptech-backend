import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { tickets } from '../ticket/ticket.models';
import { users } from '../user/user.models';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id),
  createdAt: timestamp('created_at').defaultNow(),
});
