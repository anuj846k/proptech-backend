import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '#config/env';
import logger from '#utils/logger';
import type { TokenPayload } from './user.types';

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.access_token;

  if (!token) {
    logger.warn(
      `Unauthorized access attempt from IP: ${req.ip} to ${req.originalUrl}`,
    );
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.accessSecret);
    if (typeof decoded === 'string') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded as TokenPayload;
    logger.info(`Token verified successfully for userId: ${req.user.userId}`);
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      `Invalid token attempt from IP: ${req.ip} to ${req.originalUrl} - ${message}`,
    );
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Forbidden access attempt by userId: ${req.user.userId} with role: ${req.user.role} to ${req.originalUrl}`,
      );
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
