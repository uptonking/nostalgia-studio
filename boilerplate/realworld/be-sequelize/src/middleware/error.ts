import type { NextFunction, Request, Response } from 'express';

import type { customError } from '../types/custom-types';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../utils/api-error';

/**
 * Error Handler Middleware
 */
export const errorHandler = (
  error: customError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(error);

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ errors: { body: [error.message] } });
  } else if (error instanceof ForbiddenError) {
    return res.status(403).json({ errors: { body: [error.message] } });
  } else if (error instanceof NotFoundError) {
    return res.status(404).json({ errors: { body: [error.message] } });
  } else if (error instanceof ValidationError) {
    return res.status(422).json({ errors: { body: [error.message] } });
  } else {
    return res.status(500).json({ errors: { body: [error.message] } });
  }

  // let err = error;
  // if (!(error instanceof ServerError)) {
  //   err = new ServerError(error.message);
  // }
  // const statusCode = 500;
  // res.locals.errorMessage = err.message;
  // const response = { errors: { body: [err.message] } }
  // return res.status(statusCode).send(response);
};
