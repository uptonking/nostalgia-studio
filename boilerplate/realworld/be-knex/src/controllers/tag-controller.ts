import type { NextFunction, Request, Response } from 'express';
import { tagService } from '../services/tag-service';

export const getAllTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tags = await tagService.findAllTags();

    return res.json({ tags });
  } catch (error) {
    next(error);
  }
};

export const tagController = {
  getAllTags,
};
