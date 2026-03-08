import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { formatZodError } from '#utils/zod';
import {
  createUnitSchema,
  assignTenantSchema,
} from '#validations/unit.validations';
import { findUnitsByTenantIdWithProperty } from './unit.repositories';

import { createUnitService, assignTenantToUnitService } from './unit.services';

export const createUnitController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  const { id: propertyId } = req.params;
  const parseResult = createUnitSchema.safeParse(req.body);
  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  logger.info(`createUnitController for propertyId=${propertyId}`);

  const unit = await createUnitService(
    propertyId as string,
    user.userId,
    user.role,
    parseResult.data,
  );
  return successResponse(res, 'Unit created successfully', { unit }, 201);
});

export const assignTenantToUnitController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  const { id: propertyId, unitId } = req.params;
  const parseResult = assignTenantSchema.safeParse(req.body);
  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  logger.info(
    `assignTenantToUnitController propertyId=${propertyId} unitId=${unitId}`,
  );

  const unit = await assignTenantToUnitService(
    propertyId as string,
    unitId as string,
    user.userId,
    user.role,
    parseResult.data,
  );
  return successResponse(res, 'Tenant assigned to unit successfully', {
    unit,
  });
});

export const getMyUnitsController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.userId || user?.role !== 'TENANT') {
    throw new AppError('Unauthorized', 401);
  }
  const units = await findUnitsByTenantIdWithProperty(user.userId);
  return successResponse(res, 'Units fetched successfully', { units });
});
