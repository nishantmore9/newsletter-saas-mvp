import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction 
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  // 1. Custom Known Application Errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } 
  
  // 2. Zod Input Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // 3. PostgreSQL / Drizzle Known Database Errors
  else if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation (e.g., duplicate email)
        statusCode = 409;
        message = 'A record with this information already exists.';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference ID provided.';
        break;
      default:
        logger.error(`[Database Error] Code: ${err.code} - ${err.message}`, { stack: err.stack });
    }
  } 
  
  // 4. Unknown Unhandled Exceptions
  else {
    logger.error(`[Unhandled Exception] ${err.message}`, { stack: err.stack });
  }

  // Send JSON response
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};