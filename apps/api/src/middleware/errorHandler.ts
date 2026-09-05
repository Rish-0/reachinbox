import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Centralized error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err, message: err?.message, stack: err?.stack }, 'Unhandled error');

  const statusCode = (err as any).statusCode || 500;
  const message =
    err?.message && err.message.trim().length > 0
      ? err.message
      : 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Custom error class with HTTP status code.
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
