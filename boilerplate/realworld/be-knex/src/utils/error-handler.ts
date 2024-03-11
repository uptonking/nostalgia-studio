import type { NextFunction, Request, Response } from 'express';

import type { Error } from '../types/error';
import { logger } from './logger';

export class ApiError {
  public statusCode: number;
  public message: Error;

  constructor(statusCode: number, message: Error) {
    this.statusCode = statusCode;
    this.message = message;
  }

  public static badRequest(message: Error): ApiError {
    logger.error(message);
    return new ApiError(400, message);
  }

  public static unauthorized(message?: string): ApiError {
    logger.error(message);
    return new ApiError(401, {
      key: 'token',
      message: message || 'Unauthorized',
      type: 'err.unauthorized',
      path: ['authentication'],
    });
  }

  public static forbidden(message?: string): ApiError {
    logger.error(message);
    return new ApiError(403, {
      key: 'token',
      message: message || 'Forbidden',
      type: 'err.forbidden',
      path: ['authentication'],
    });
  }

  public static notFound(message?: string): ApiError {
    logger.error(message);
    return new ApiError(404, {
      key: 'notFound',
      message: message || 'Not Found',
      type: 'err.notFound',
      path: ['notFound'],
    });
  }

  public static limited(
    message: Error = {
      key: 'ratelimit',
      message: 'Too many requests!',
      type: 'err.ratelimit',
      path: ['rate-limit'],
    },
  ): ApiError {
    logger.error(message);
    return new ApiError(429, message);
  }

  public static internalError(
    message: Error = {
      message: 'Something went wrong!',
      type: 'err.internal',
      key: 'internal-server',
    },
  ): ApiError {
    logger.error(message);
    return new ApiError(500, message);
  }

  public static emptyBody(
    message: Error = {
      message: 'Request body is empty',
      type: 'err.body-null',
      key: 'req.body',
    },
  ): ApiError {
    logger.error(message);
    return new ApiError(400, message);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).send(error.message);
    return;
  }

  logger.error(error);
  res.status(500).send(error.message);
  next();
};
