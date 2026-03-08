import { desc, eq, and } from 'drizzle-orm';
import { db } from '#db/db';
import { ticketImages, tickets } from './ticket.models';
import {
  activityLogs,
  type actionTypeEnum,
} from '../activity/activity.models';
import { properties } from '../property/property.models';
import { units } from '../unit/unit.models';

type CreateTicketRepoInput = {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tenantId: string;
  unitId: string;
};

export const findUnitByPropertyAndNumber = async (
  propertyId: string,
  unitNumber: string,
) => {
  const [unit] = await db
    .select()
    .from(units)
    .where(
      and(eq(units.propertyId, propertyId), eq(units.unitNumber, unitNumber)),
    )
    .limit(1);

  return unit || null;
};

export const findUnitById = async (id: string) => {
  const [unit] = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return unit ?? null;
};

export const createTicket = async (data: CreateTicketRepoInput) => {
  const [ticket] = await db
    .insert(tickets)
    .values({
      title: data.title,
      description: data.description,
      priority: data.priority,
      tenantId: data.tenantId,
      unitId: data.unitId,
    })
    .returning();

  return ticket;
};

export const createTicketImage = async (ticketId: string, imageUrl: string) => {
  const [image] = await db
    .insert(ticketImages)
    .values({
      ticketId,
      imageUrl,
    })
    .returning();

  return image;
};

type CreateActivityLogInput = {
  ticketId: string;
  performedBy: string;
  actionType: (typeof actionTypeEnum.enumValues)[number];
  oldValue?: string | null;
  newValue?: string | null;
};

export const createActivityLog = async (data: CreateActivityLogInput) => {
  const [log] = await db
    .insert(activityLogs)
    .values({
      ticketId: data.ticketId,
      performedBy: data.performedBy,
      actionType: data.actionType,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
    })
    .returning();

  return log;
};

export const findTicketsByTenantId = async (tenantId: string) => {
  const results = await db
    .select()
    .from(tickets)
    .where(eq(tickets.tenantId, tenantId))
    .orderBy(desc(tickets.createdAt));

  return results;
};

export type ListTicketsFilters = {
  status?: typeof tickets.$inferSelect.status | null;
  priority?: typeof tickets.$inferSelect.priority | null;
  propertyId?: string | null;
};

export const findAllTicketsForManager = async (
  managerId: string,
  filters?: ListTicketsFilters,
) => {
  const conditions = [eq(properties.managerId, managerId)];
  if (filters?.status !== null && filters?.status !== undefined) {
    conditions.push(eq(tickets.status, filters.status));
  }
  if (filters?.priority !== null && filters?.priority !== undefined) {
    conditions.push(eq(tickets.priority, filters.priority));
  }
  if (filters?.propertyId !== null && filters?.propertyId !== undefined) {
    conditions.push(eq(properties.id, filters.propertyId));
  }

  const results = await db
    .select({
      ticket: tickets,
      unitNumber: units.unitNumber,
      propertyId: properties.id,
      propertyName: properties.name,
    })
    .from(tickets)
    .innerJoin(units, eq(tickets.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(desc(tickets.createdAt));

  return results;
};

export const findAllTicketsForOwner = async (
  ownerId: string,
  filters?: ListTicketsFilters,
) => {
  const conditions = [eq(properties.ownerId, ownerId)];
  if (filters?.status !== null && filters?.status !== undefined) {
    conditions.push(eq(tickets.status, filters.status));
  }
  if (filters?.priority !== null && filters?.priority !== undefined) {
    conditions.push(eq(tickets.priority, filters.priority));
  }
  if (filters?.propertyId !== null && filters?.propertyId !== undefined) {
    conditions.push(eq(properties.id, filters.propertyId));
  }

  const results = await db
    .select({
      ticket: tickets,
      unitNumber: units.unitNumber,
      propertyId: properties.id,
      propertyName: properties.name,
    })
    .from(tickets)
    .innerJoin(units, eq(tickets.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(desc(tickets.createdAt));

  return results;
};

export const findTicketById = async (id: string) => {
  const [row] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);
  return row ?? null;
};

export const findTicketImagesByTicketId = async (ticketId: string) => {
  return db
    .select()
    .from(ticketImages)
    .where(eq(ticketImages.ticketId, ticketId))
    .orderBy(desc(ticketImages.uploadedAt));
};

export const findActivityLogsByTicketId = async (ticketId: string) => {
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.ticketId, ticketId))
    .orderBy(desc(activityLogs.createdAt));
};

type UpdateTicketInput = Partial<{
  technicianId: string | null;
  status: typeof tickets.$inferSelect.status;
  priority: typeof tickets.$inferSelect.priority;
}>;

export const updateTicket = async (
  ticketId: string,
  data: UpdateTicketInput,
) => {
  const [updated] = await db
    .update(tickets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();
  return updated ?? null;
};

export const findTicketsByTechnicianId = async (technicianId: string) => {
  return db
    .select()
    .from(tickets)
    .where(eq(tickets.technicianId, technicianId))
    .orderBy(desc(tickets.createdAt));
};
