import { Router } from 'express';
import { getMyUnitsController } from './unit.controllers';
import { isAuthenticated, authorizeRoles } from '../user/user.middlewares';

const unitRouter: Router = Router();

unitRouter.get(
  '/my',
  isAuthenticated,
  authorizeRoles('TENANT'),
  getMyUnitsController,
);

export default unitRouter;
