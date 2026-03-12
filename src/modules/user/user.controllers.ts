import type { Request, Response } from 'express';
import { config } from '#config/env';
import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import * as userService from './user.services';
import { ALLOWED_USER_ROLES, type UserRole } from './user.types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
};

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  logger.info(`Register request for email: ${email}`);

  const { accessToken, refreshToken } = await userService.createUser(req.body);
  setCookies(res, accessToken, refreshToken);

  logger.info(`User registered successfully: ${email}`);
  return successResponse(
    res,
    'User registered successfully',
    { accessToken, refreshToken },
    201,
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  logger.info(`Login attempt for email: ${email}`);

  const { accessToken, refreshToken } = await userService.loginUser(
    email,
    password,
  );
  setCookies(res, accessToken, refreshToken);

  logger.info(`User logged in successfully: ${email}`);
  return successResponse(res, 'Login successful', {
    accessToken,
    refreshToken,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new AppError('Unauthorized', 401);
  }
  const user = await userService.getCurrentUser(req.user.userId);
  logger.info(`Fetched current user: ${user.email}`);
  return successResponse(res, 'User fetched successfully', { user });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, page, limit } = req.query;

  let roleFilter: UserRole | undefined;

  if (role) {
    if (!ALLOWED_USER_ROLES.includes(role as UserRole)) {
      throw new AppError('Invalid role filter', 400);
    }
    roleFilter = role as UserRole;
  }

  const pageNum = page ? Number(page) : undefined;
  const limitNum = limit ? Number(limit) : undefined;

  if (pageNum !== undefined && (isNaN(pageNum) || pageNum < 1)) {
    throw new AppError('Invalid page number', 400);
  }
  if (
    limitNum !== undefined &&
    (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
  ) {
    throw new AppError('Invalid limit (1-100)', 400);
  }

  const { users, total } = await userService.getUsers(
    roleFilter,
    pageNum,
    limitNum,
  );
  return successResponse(res, 'Users fetched successfully', {
    users,
    total,
    page: pageNum ?? 1,
    limit: limitNum ?? total,
    totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  logger.info(`Manager fetching user by id: ${id}`);

  const user = await userService.getUserById(id);
  return successResponse(res, 'User fetched successfully', { user });
});

export const updateUserById = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  logger.info(`Manager updating user ${id}`);

  const updatedUser = await userService.updateUser(id, req.body);
  return successResponse(res, 'User updated successfully', {
    user: updatedUser,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies.refresh_token;
  if (!token) {
    throw new AppError('Refresh token missing', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } =
    userService.refreshAccessToken(token);
  setCookies(res, accessToken, newRefreshToken);

  return successResponse(res, 'Token refreshed successfully', {
    accessToken,
    refreshToken: newRefreshToken,
  });
});

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
  return successResponse(res, 'Logged out successfully');
};
