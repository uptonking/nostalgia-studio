import type { NextFunction, Request, Response } from 'express';

import type { customError } from '../types/custom-types';
import { ApiError } from '../utils/api-error';

/**
 * Error Handler Middleware
 * @param error
 * @param req
 * @param res
 * @param next
 */
export const errorHandler = (
  error: customError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let err = error;

  if (!(error instanceof ApiError)) {
    const statusCode = 500;
    const message = error.message || 'Internal server error';
    err = new ApiError(statusCode, message);
  }

  const { statusCode, message } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
  };

  res.status(statusCode).send(response);
};
