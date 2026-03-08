import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { formatZodError } from '#utils/zod';
import { createUnitSchema } from '#validations/unit.validations';
import { createUnitService } from './unit.services';

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
