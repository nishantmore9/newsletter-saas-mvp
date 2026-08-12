import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

type ErrorResponse = {
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
};

const mapError = (err: unknown): ErrorResponse => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation error',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const error = err as { code?: string; message?: string; stack?: string };

    if (error.code === '23505') {
      return {
        statusCode: 409,
        message: 'A record with this information already exists.',
      };
    }

    if (error.code === '23503') {
      return {
        statusCode: 400,
        message: 'Invalid reference ID provided.',
      };
    }

    logger.error(`[Database Error] Code: ${error.code} - ${error.message ?? 'Unknown error'}`, {
      stack: error.stack,
    });
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  logger.error(`[Unhandled Exception] ${message}`, {
    stack: err instanceof Error ? err.stack : undefined,
  });

  return {
    statusCode: 500,
    message: 'Internal Server Error',
  };
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const { statusCode, message, errors } = mapError(err);

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV !== 'production' && err instanceof Error ? { stack: err.stack } : {}),
  });
};