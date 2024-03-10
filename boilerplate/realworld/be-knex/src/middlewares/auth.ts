import type { NextFunction, Request, Response } from 'express';

import { userService } from '../services/user-service';
import type { ROLE } from '../utils/common';
import { ApiError } from '../utils/error-handler';
import { verifyToken } from '../utils/jsonwebtoken';

/**
 * Add user data or null to request { req.user }
 * - Set user info to req.user object, null if authentication token is not provided
 * @param req.user - SanitizedUserData
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeaders = req.headers['authorization'];
    if (!authHeaders) throw null;

    const [, token] = authHeaders.split(/Bearer\s/);
    const { id } = verifyToken(token);

    req.user = await userService.findOne(id);
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

export const authorize =
  (roles: ROLE[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) return next(ApiError.forbidden(401));

    const role = req.user.role as ROLE;
    if (!roles.includes(role)) return next(ApiError.forbidden(403));

    return next();
  };
