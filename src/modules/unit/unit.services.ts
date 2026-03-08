import { AppError } from '#utils/error';
import logger from '#utils/logger';
import type {
  CreateUnitInput,
  AssignTenantInput,
} from '#validations/unit.validations';
import {
  createUnit,
  findUnitByPropertyAndNumber,
  findUnitById,
  updateUnitTenant,
} from './unit.repositories';
import { findPropertyById } from '../property/property.repositories';
import { findUserById } from '../user/user.repositories';

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

export const assignTenantToUnitService = async (
  propertyId: string,
  unitId: string,
  userId: string,
  role: string,
  data: AssignTenantInput,
) => {
  const property = await findPropertyById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId === userId;
  const isManager = property.managerId === userId;

  if (role === 'ADMIN' && !isOwner) {
    throw new AppError('You can only manage units in properties you own', 403);
  }

  if (role === 'MANAGER' && !isManager) {
    throw new AppError(
      'You can only manage units in properties you manage',
      403,
    );
  }

  const unit = await findUnitById(unitId);
  if (!unit) {
    throw new AppError('Unit not found', 404);
  }

  if (unit.propertyId !== propertyId) {
    throw new AppError('Unit does not belong to this property', 400);
  }

  if (data.tenantId !== null) {
    const tenant = await findUserById(data.tenantId);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    if (tenant.role !== 'TENANT') {
      throw new AppError(
        'User must have role TENANT to be assigned to a unit',
        400,
      );
    }
  }

  const updated = await updateUnitTenant(unitId, data.tenantId);
  logger.info(
    `Unit ${unitId} tenant ${data.tenantId ?? 'unassigned'} by userId=${userId}`,
  );
  return updated;
};
