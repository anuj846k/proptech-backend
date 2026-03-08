import { Router } from 'express';
import {
  getMyNotificationsController,
  markNotificationAsReadController,
} from './notification.controllers';
import { isAuthenticated } from '../user/user.middlewares';

const notificationRouter: Router = Router();

notificationRouter.get('/', isAuthenticated, getMyNotificationsController);

notificationRouter.patch(
  '/:id/read',
  isAuthenticated,
  markNotificationAsReadController,
);

export default notificationRouter;
