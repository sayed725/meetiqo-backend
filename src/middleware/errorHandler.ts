import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorDetails: string | null = null;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = 'Validation Error';
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        errorMessage = 'Conflict: Unique constraint failed';
        errorDetails = err.message;
        break;
      case 'P2025':
        statusCode = 404;
        errorMessage = 'Not Found: Record not found';
        errorDetails = err.message;
        break;
      default:
        statusCode = 400;
        errorMessage = 'Bad Request';
        errorDetails = err.message;
        break;
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = 'Internal Server Error';
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    errorMessage = 'Internal Server Error: Initialization Error';
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = 'Internal Server Error: Rust Panic';
    errorDetails = err.message;
  } else if (err instanceof Error) {
    statusCode = (err as any).statusCode || (err as any).status || 500;
    errorMessage = err.message || 'Internal Server Error';
  }

  logger.error({ err, statusCode }, 'Unhandled error');

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorDetails,
  });
};
