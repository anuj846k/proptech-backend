import { and, eq } from 'drizzle-orm';
import { db } from '#db/db';
import { units } from './unit.models';
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
