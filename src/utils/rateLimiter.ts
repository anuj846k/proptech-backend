import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '#utils/logger';

const points = parseInt(process.env.RATE_LIMIT_POINTS || '300', 10);
const duration = parseInt(process.env.RATE_LIMIT_DURATION || '60', 10);

const rateLimiter = new RateLimiterMemory({
  points,
  duration,
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ip = req.ip ?? 'unknown';

    await rateLimiter.consume(ip);

    next();
  } catch {
    logger.warn('Rate Limit Exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }
};
