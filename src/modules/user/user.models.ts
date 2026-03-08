import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userRoles = ['ADMIN', 'MANAGER', 'TENANT', 'TECHNICIAN'] as const;
export type UserRole = (typeof userRoles)[number];

export const roleEnum = pgEnum('role', userRoles);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
