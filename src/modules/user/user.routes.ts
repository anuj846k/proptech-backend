import { Router } from 'express';
import {
  getCurrentUser,
  getUserById,
  getUsers,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  updateUserById,
} from './user.controllers';
import { authorizeRoles, isAuthenticated } from './user.middlewares';

const userRouter: Router = Router();

userRouter.post('/auth/register', registerUser);
userRouter.post('/auth/login', loginUser);
userRouter.post('/auth/refresh', refreshToken);
userRouter.post('/auth/logout', logoutUser);
userRouter.get('/auth/me', isAuthenticated, getCurrentUser);
userRouter.get(
  '/users',
  isAuthenticated,
  authorizeRoles('ADMIN', 'MANAGER'),
  getUsers,
);
userRouter.put(
  '/users/:id',
  isAuthenticated,
  authorizeRoles('ADMIN'),
  updateUserById,
);
userRouter.get(
  '/users/:id',
  isAuthenticated,
  authorizeRoles('ADMIN'),
  getUserById,
);

export default userRouter;
