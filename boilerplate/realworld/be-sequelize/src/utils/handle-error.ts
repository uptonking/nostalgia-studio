import type { NextFunction, Request, Response } from 'express';

import type { ControllerFunction } from '../types/custom-types';

export function catchError(fn: ControllerFunction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
}
