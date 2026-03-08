import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import {
  getMyNotificationsService,
  markAsReadService,
} from './notification.services';

export const getMyNotificationsController = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.userId) {
    throw new AppError('Unauthorized', 401);
  }
  const notifications = await getMyNotificationsService(user.userId);
  return successResponse(res, 'Notifications fetched successfully', {
    notifications,
  });
});

export const markNotificationAsReadController = asyncHandler(
  async (req, res) => {
    const user = req.user;
    if (!user?.userId) {
      throw new AppError('Unauthorized', 401);
    }
    const notificationId = req.params.id;
    if (!notificationId) {
      throw new AppError('Notification id is required', 400);
    }
    const updated = await markAsReadService(
      notificationId as string,
      user.userId,
    );
    return successResponse(res, 'Notification marked as read', {
      notification: updated,
    });
  },
);
