import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { formatZodError } from '#utils/zod';
import {
  assignManagerSchema,
  propertyCreateSchema,
} from '#validations/property.validations';
import {
  assignManagerToPropertyService,
  createPropertyService,
  getPropertiesService,
  getPropertyByIdService,
} from './property.services';

export const createPropertyController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.userId) {
    throw new AppError('Unauthorized', 401);
  }

  const parseResult = propertyCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const data = parseResult.data;

  logger.info(
    `createPropertyController by userId=${user.userId} name=${data.name}`,
  );

  const property = await createPropertyService(user.userId, data);
  return successResponse(
    res,
    'Property created successfully',
    { property },
    201,
  );
});

export const getPropertiesController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.userId || !user.role) {
    throw new AppError('Unauthorized', 401);
  }
  logger.info(
    `getPropertiesController for userId=${user.userId} role=${user.role}`,
  );
  const properties = await getPropertiesService(user.userId, user.role);
  return successResponse(res, 'Properties fetched successfully', {
    properties,
  });
});

export const getPropertyByIdController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.userId || !user.role) {
    throw new AppError('Unauthorized', 401);
  }
  const { id } = req.params;
  const result = await getPropertyByIdService(
    id as string,
    user.userId,
    user.role,
  );
  return successResponse(res, 'Property fetched successfully', result);
});

export const assignManagerController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.userId) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;
  const parseResult = assignManagerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const property = await assignManagerToPropertyService(
    id as string,
    user.userId,
    parseResult.data.managerId,
  );
  return successResponse(res, 'Manager assigned successfully', { property });
});
