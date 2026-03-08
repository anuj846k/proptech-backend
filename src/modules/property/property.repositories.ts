import { eq, and } from 'drizzle-orm';
import { db } from '#db/db';
import { properties } from './property.models';
import { units } from '../unit/unit.models';

type CreatePropertyRepoInput = {
  name: string;
  address: string;
  ownerId: string;
};

export const createProperty = async (data: CreatePropertyRepoInput) => {
  const [property] = await db
    .insert(properties)
    .values({
      name: data.name,
      address: data.address,
      ownerId: data.ownerId,
      managerId: null,
    })
    .returning();

  return property;
};

export const findPropertiesByOwnerId = async (ownerId: string) => {
  const results = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, ownerId));
  return results;
};

export const findPropertiesByManagerId = async (managerId: string) => {
  const results = await db
    .select()
    .from(properties)
    .where(eq(properties.managerId, managerId));
  return results;
};

export const findPropertyById = async (id: string) => {
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);
  return property ?? null;
};

export const findPropertyByNameAndOwner = async (
  name: string,
  ownerId: string,
) => {
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.name, name), eq(properties.ownerId, ownerId)))
    .limit(1);
  return property ?? null;
};

export const findUnitsByPropertyId = async (propertyId: string) => {
  return db.select().from(units).where(eq(units.propertyId, propertyId));
};

export const updatePropertyManager = async (
  propertyId: string,
  managerId: string,
) => {
  const [updated] = await db
    .update(properties)
    .set({ managerId })
    .where(eq(properties.id, propertyId))
    .returning();
  return updated ?? null;
};

export type OccupancyRow = {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  occupiedCount: number;
  vacantCount: number;
};

export const findOccupancyByOwnerId = async (
  ownerId: string,
): Promise<OccupancyRow[]> => {
  const props = await findPropertiesByOwnerId(ownerId);
  const results: OccupancyRow[] = [];
  for (const p of props) {
    const unitsList = await findUnitsByPropertyId(p.id);
    const occupiedCount = unitsList.filter((u) => u.tenantId !== null).length;
    const vacantCount = unitsList.length - occupiedCount;
    results.push({
      propertyId: p.id,
      propertyName: p.name,
      totalUnits: unitsList.length,
      occupiedCount,
      vacantCount,
    });
  }
  return results;
};

export const findOccupancyByManagerId = async (
  managerId: string,
): Promise<OccupancyRow[]> => {
  const props = await findPropertiesByManagerId(managerId);
  const results: OccupancyRow[] = [];
  for (const p of props) {
    const unitsList = await findUnitsByPropertyId(p.id);
    const occupiedCount = unitsList.filter((u) => u.tenantId !== null).length;
    const vacantCount = unitsList.length - occupiedCount;
    results.push({
      propertyId: p.id,
      propertyName: p.name,
      totalUnits: unitsList.length,
      occupiedCount,
      vacantCount,
    });
  }
  return results;
};
