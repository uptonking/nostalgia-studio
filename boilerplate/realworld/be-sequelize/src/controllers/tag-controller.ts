import type { NextFunction, Request, Response } from 'express';

import { findAllTags } from '../services/tag-service';

export const getAllTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tags = await findAllTags();

    return res.json({ tags });
  } catch (error) {
    next(error);
  }
};
