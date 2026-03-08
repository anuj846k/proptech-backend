import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import { getTicketActivityService } from './activity.services';

export const getTicketActivityController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.userId) {
    throw new AppError('Unauthorized', 401);
  }

  const ticketId = req.params.id;
  if (!ticketId) {
    throw new AppError('Ticket id is required', 400);
  }

  const activity = await getTicketActivityService(ticketId as string, user);
  return successResponse(res, 'Activity fetched successfully', { activity });
});
