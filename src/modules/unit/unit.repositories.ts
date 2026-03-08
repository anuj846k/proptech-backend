import { and, eq } from 'drizzle-orm';
import { db } from '#db/db';
import { units } from './unit.models';
import { properties } from '../property/property.models';
type CreateUnitRepoInput = {
  propertyId: string;
  unitNumber: string;
  floor: number;
  tenantId?: string | null;
};
export const createUnit = async (data: CreateUnitRepoInput) => {
  const [unit] = await db
    .insert(units)
    .values({
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      floor: data.floor,
      tenantId: data.tenantId ?? null,
    })
    .returning();
  return unit ?? null;
};

export const findUnitById = async (id: string) => {
  const [unit] = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return unit ?? null;
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
  return unit ?? null;
};

export const updateUnitTenant = async (
  unitId: string,
  tenantId: string | null,
) => {
  const [updated] = await db
    .update(units)
    .set({ tenantId })
    .where(eq(units.id, unitId))
    .returning();
  return updated ?? null;
};

export type MyUnitRow = {
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
};

export const findUnitsByTenantIdWithProperty = async (
  tenantId: string,
): Promise<MyUnitRow[]> => {
  const rows = await db
    .select({
      unitId: units.id,
      unitNumber: units.unitNumber,
      propertyId: properties.id,
      propertyName: properties.name,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(units.tenantId, tenantId));
  return rows;
};
