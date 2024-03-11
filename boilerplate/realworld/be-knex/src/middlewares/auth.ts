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
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeaders = req.headers['authorization'];
    // if (!authHeaders) throw null;
    if (!authHeaders) return next();

    // const [, token] = authHeaders.split(/Bearer\s/);
    const token = authHeaders.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Token missing or malformed'));
    }

    // todo check if expired
    const decoded = verifyToken(token);
    if (!decoded.id) {
      return next(ApiError.unauthorized('Token expired or malformed'));
    }
    // console.log(';; jwt-decoded ', decoded);

    const _user = await userService.findOne(decoded.id);
    if (!_user) {
      return next(
        ApiError.notFound('User Not Found ' + JSON.stringify(decoded)),
      );
    }
    // console.log(';; jwt-user ', req.url, _user);
    req.user = _user;
    req.user['token'] = token;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

export const authorizeUser =
  (roles?: ROLE[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) return next(ApiError.unauthorized());

    // const role = req.user.role as ROLE;
    // if (!roles.includes(role)) return next(ApiError.forbidden(403));

    return next();
  };
