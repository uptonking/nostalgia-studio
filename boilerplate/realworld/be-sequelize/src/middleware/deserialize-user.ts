import type { NextFunction, Request, Response } from 'express';

import { verify } from '../utils/jwt';
import { get } from '../utils/common';

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bearerToken = get(req, 'headers.authorization');
  let token = bearerToken;
  if (bearerToken && bearerToken.startsWith('Bearer ')) {
    token = bearerToken.substring(7);
  }
  if (!token) return next();

  const { decoded, expired, valid, msg: errorMsg } = verify(token);

  if (valid && !expired) {
    req.user = decoded;
    return next();
  } else {
    return res.status(403).json({
      error: true,
      errorMsg: errorMsg,
    });
  }
};

export default deserializeUser;
