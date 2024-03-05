import type { NextFunction, Request, Response } from 'express';
import { get } from '../utils/common';

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user: any = get(req, 'user');

    if (user.role !== 1) {
      return res
        .status(403)
        .json({ error: true, errorMsg: 'Access not granted' });
    }
    return next();
  } catch (err) {
    let msg = 'Internal Server Error';
    if (err instanceof Error) {
      msg = err.message;
    } else if (err) {
      msg = err as string;
    }
    return res.status(400).json({ errorMsg: msg, error: true });
  }
};
export default isAdmin;
