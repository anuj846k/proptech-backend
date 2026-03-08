import { Router } from 'express';
import {
  createPropertyController,
  getOccupancyController,
  getPropertiesController,
  getPropertyByIdController,
  assignManagerController,
} from './property.controllers';
import {
  createUnitController,
  assignTenantToUnitController,
} from '../unit/unit.controllers';
import { isAuthenticated, authorizeRoles } from '../user/user.middlewares';

const propertyRouter: Router = Router();

propertyRouter.post(
  '/',
  isAuthenticated,
  authorizeRoles('ADMIN'),
  createPropertyController,
);

propertyRouter.get(
  '/',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  getPropertiesController,
);

propertyRouter.get(
  '/occupancy',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  getOccupancyController,
);

propertyRouter.get(
  '/:id',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  getPropertyByIdController,
);

propertyRouter.post(
  '/:id/assign-manager',
  isAuthenticated,
  authorizeRoles('ADMIN'),
  assignManagerController,
);

propertyRouter.post(
  '/:id/units',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  createUnitController,
);

propertyRouter.patch(
  '/:id/units/:unitId',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  assignTenantToUnitController,
);

export default propertyRouter;
