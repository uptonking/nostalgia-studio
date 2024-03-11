import { db } from '../db/connection';

export const findAll = async (options?: any) => {
  const tags = await db('tags').pluck('name');
  return tags;
};

export const tagRepo = {
  findAll,
};
