import type { NextFunction, Request, Response } from 'express';

// todo deprecate in favor of namespace override
export interface customRequest extends Request {
  user: any;
}

export interface customError extends Error {
  statusCode: number;
}

export type ControllerFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
