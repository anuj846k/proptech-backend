import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';
import { properties } from '../property/property.models';
import { users } from '../user/user.models';

export const units = pgTable('units', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id),
  unitNumber: text('unit_number').notNull(),
  floor: integer('floor').notNull(),
  tenantId: uuid('tenant_id').references(() => users.id),
});
