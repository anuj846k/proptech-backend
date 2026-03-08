import { AppError } from '#utils/error';
import logger from '#utils/logger';
import type { CreateUnitInput } from '#validations/unit.validations';
import { createUnit, findUnitByPropertyAndNumber } from './unit.repositories';
import { findPropertyById } from '../property/property.repositories';

export const createUnitService = async (
  propertyId: string,
  userId: string,
  role: string,
  data: CreateUnitInput,
) => {
  const property = await findPropertyById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId === userId;
  const isManager = property.managerId === userId;

  if (role === 'ADMIN' && !isOwner) {
    throw new AppError('You can only add units to properties you own', 403);
  }

  if (role === 'MANAGER' && !isManager) {
    throw new AppError('You can only add units to properties you manage', 403);
  }

  const existing = await findUnitByPropertyAndNumber(
    propertyId,
    data.unitNumber,
  );
  if (existing) {
    throw new AppError(
      `Unit ${data.unitNumber} already exists for this property`,
      400,
    );
  }

  const unit = await createUnit({
    propertyId,
    unitNumber: data.unitNumber,
    floor: data.floor,
    tenantId: data.tenantId ?? null,
  });

  logger.info(
    `Unit created id=${unit?.id} propertyId=${propertyId} by userId=${userId}`,
  );
  return unit;
};
