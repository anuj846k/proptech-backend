import jwt from 'jsonwebtoken';
import { config } from '#config/env';
import { hashPassword, VerifyPassword } from '#utils/argon';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { formatZodError } from '#utils/zod';
import { updateUserSchema, userSchema } from '#validations/user.validations';
import {
  findExistingUser,
  findUserById,
  listUsers,
  registerUser,
  updateUserById,
} from './user.repositories';
import type { PublicUser, TokenPayload, UserRole } from './user.types';

export const createUser = async (data: unknown) => {
  logger.info(
    `Register attempt with email: ${(data as { email?: string }).email}`,
  );

  const validatedData = userSchema.safeParse(data);
  if (!validatedData.success) {
    const messages = formatZodError(validatedData.error);
    logger.warn(`Validation failed: ${messages}`, { received: data });
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const { name, email, password, role, phone } = validatedData.data;

  logger.info('Validated data:', {
    name: !!name,
    email: !!email,
    password: !!password,
    role,
    phone: !!phone,
  });

  const existingUser = await findExistingUser(email, phone || undefined);
  if (existingUser) {
    if (existingUser.email === email) {
      logger.warn(`Registration failed - Email already in use: ${email}`);
      throw new AppError('Email already in use', 400);
    }
    if (phone && existingUser.phone === phone) {
      logger.warn(`Registration failed - Phone already in use: ${phone}`);
      throw new AppError('Phone number already in use', 400);
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await registerUser({
    name,
    email,
    hashedPassword,
    phone: phone || null,
    role,
  });
  if (!user) {
    logger.error(`Failed to register user: ${email}`);
    throw new AppError('Failed to register user', 500);
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.accessSecret,
    { expiresIn: config.accessTokenExpiry },
  );
  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.refreshSecret,
    { expiresIn: config.refreshTokenExpiry },
  );

  logger.info(`User registered successfully: ${email}`);
  return { accessToken, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
  logger.info(`Login attempt for email: ${email}`);

  if (!email || !password) {
    logger.warn(`Login failed - Missing credentials`);
    throw new AppError('Email and password are required', 400);
  }

  const user = await findExistingUser(email);
  if (!user) {
    logger.warn(`Login failed - User not found: ${email}`);
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await VerifyPassword(user.passwordHash, password);
  if (!isPasswordValid) {
    logger.warn(`Login failed - Invalid password: ${email}`);
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.accessSecret,
    { expiresIn: config.accessTokenExpiry },
  );
  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.refreshSecret,
    { expiresIn: config.refreshTokenExpiry },
  );

  logger.info(`User logged in successfully: ${email}`);
  return { accessToken, refreshToken };
};

export const getCurrentUser = async (userId: string) => {
  logger.info(`Fetching user with ID: ${userId}`);
  const user = await findUserById(userId);

  if (!user) {
    logger.warn(`User not found: ${userId}`);
    throw new AppError('User not found', 404);
  }

  logger.info(`Fetched user successfully: ${user.email}`);
  return toPublicUser(user);
};

export const getUsers = async (
  role?: UserRole,
  page?: number,
  limit?: number,
) => {
  logger.info(
    `Listing users${role ? ` with role: ${role}` : ''}${page ? ` page: ${page}` : ''}`,
  );
  return listUsers(role, page, limit);
};

const toPublicUser = (u: PublicUser): PublicUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  createdAt: u.createdAt,
});

export const getUserById = async (id: string): Promise<PublicUser> => {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toPublicUser(user);
};

export const updateUser = async (
  id: string,
  payload: unknown,
): Promise<PublicUser> => {
  const validatedData = updateUserSchema.safeParse(payload);
  if (!validatedData.success) {
    const messages = formatZodError(validatedData.error);
    logger.warn(`Update validation failed: ${messages}`);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const updateData = {
    ...(validatedData.data.name !== undefined && {
      name: validatedData.data.name,
    }),
    ...(validatedData.data.phone !== undefined && {
      phone: validatedData.data.phone,
    }),
    ...(validatedData.data.role !== undefined && {
      role: validatedData.data.role,
    }),
  };

  const updated = await updateUserById(id, updateData);
  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(updated);
};

export const refreshAccessToken = (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      config.refreshSecret,
    ) as TokenPayload;

    const accessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      config.accessSecret,
      { expiresIn: config.accessTokenExpiry },
    );
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      config.refreshSecret,
      { expiresIn: config.refreshTokenExpiry },
    );

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`refreshAccessToken error: ${message}`);
    throw new AppError('Invalid or expired refresh token', 401);
  }
};
