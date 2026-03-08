import { Router } from 'express';
import {
  createPropertyController,
  getPropertiesController,
  getPropertyByIdController,
  assignManagerController,
} from './property.controllers';
import { createUnitController } from '../unit/unit.controllers';
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

export default propertyRouter;
