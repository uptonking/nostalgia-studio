import type { NextFunction, Request, Response } from 'express';

import { userService } from '../services/user-service';
import { ApiError } from '../utils/error-handler';

/** get user data */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    return next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) return next(ApiError.forbidden());

    // only allow user to update themselves
    const { id } = req.user;
    const data = await userService.findOneAndUpdate(id, req.body);
    res.status(200).send(data);
  } catch (err) {
    return next(err);
  }
};

export const userController = {
  me,
  update,
};
