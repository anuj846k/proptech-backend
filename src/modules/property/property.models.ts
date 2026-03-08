import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from '../user/user.models';

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    managerId: uuid('manager_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [unique('property_name_owner_idx').on(table.name, table.ownerId)],
);
