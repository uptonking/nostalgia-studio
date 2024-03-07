import type { NextFunction, Request, Response } from 'express';

import { get } from '../utils/common';
import { verify } from '../utils/jwt';

/** deserialize user data from jwt */
export async function deserializeUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { headers } = req;
    if (!headers.authorization) return next();

    // const bearerToken = get(req, 'headers.authorization');
    // let token = bearerToken;
    // if (bearerToken && bearerToken.startsWith('Bearer ')) {
    //   token = bearerToken.substring(7);
    // }
    const token = headers.authorization.split(' ')[1];
    if (!token) throw new SyntaxError('Token missing or malformed');
    // if (!token) return next();

    const { decoded, expired, valid, msg: errorMsg } = verify(token);

    if (!valid) {
      throw new Error('Invalid Token');
    }

    if (valid && !expired) {
      req.user = decoded;
      return next();
    } else {
      return res.status(403).json({
        error: true,
        errorMsg: errorMsg,
      });
    }
  } catch (error) {
    next(error);
  }
}

export default deserializeUser;
