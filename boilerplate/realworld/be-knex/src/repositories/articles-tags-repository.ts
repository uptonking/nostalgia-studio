import { db } from '../db/connection';

export const insertMany = async (articlesAndTags?: any[]) => {
  const rows = await db('articles_tags').insert(articlesAndTags);
  return rows;
};

export const articlesTagsRepo = {
  insertMany,
};
