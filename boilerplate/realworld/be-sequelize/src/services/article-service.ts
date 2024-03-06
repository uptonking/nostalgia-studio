import { Article } from '../models/article';

export const findAllArticles = async (options: any) => {
  return await Article.findAndCountAll(options);
};
