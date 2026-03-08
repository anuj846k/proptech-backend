import { type Response } from 'express';

export const successResponse = (
  res: Response,
  message: string,
  data: Record<string, unknown> = {},
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
