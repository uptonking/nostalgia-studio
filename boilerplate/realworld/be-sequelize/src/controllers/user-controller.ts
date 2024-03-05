import type { NextFunction, Request, Response } from 'express';

import { findOneUser, updateUserById } from '../services/user-service';
import { ApiError } from '../utils/api-error';
import { omit } from '../utils/common';

const omitData = ['password'];

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userId } = req.user;

    let body = req.body;
    body = omit(body, omitData);

    const user = await findOneUser({ id: userId });

    if (!user) {
      throw new ApiError(400, 'User not found');
    }

    const updated = await updateUserById(body, parseInt(userId, 10));

    return res.status(200).json({
      updated: updated[0],
      msg: updated[0] ? 'Data updated successfully' : 'failed to update',
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      data: req.user,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};
