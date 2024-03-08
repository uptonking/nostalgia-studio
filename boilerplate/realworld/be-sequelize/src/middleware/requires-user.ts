import type { NextFunction, Request, Response } from 'express';

import { findUserById } from '../services/user-service';
import { UnauthorizedError } from '../utils/api-error';
import { get } from '../utils/common';

export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user: any = get(req, 'user');

    if (!user) {
      // return res
      //   .status(403)
      //   .json({ errorMsg: 'Auth token user not found', error: true });
      next(new UnauthorizedError());
    }

    const data = await findUserById(user.id);
    req.user = data?.toJSON();

    return next();
  } catch (err) {
    let msg = 'Internal Server Error ' + JSON.stringify(req.user);
    if (err instanceof Error) {
      msg = err.message;
    } else if (err) {
      msg = err as string;
    }
    return res.status(400).json({ errorMsg: msg, error: true });
  }
};
