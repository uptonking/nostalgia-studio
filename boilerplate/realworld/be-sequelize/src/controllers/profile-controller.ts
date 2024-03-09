import type { NextFunction, Request, Response } from 'express';

import { findOneUser } from '../services/user-service';
import { NotFoundError } from '../utils/api-error';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username } = req.params;
    const profile = await findOneUser({ username });
    if (!profile) throw new NotFoundError('User ' + username);

    // await appendFollowers(loggedUser, profile);

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};
