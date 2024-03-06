import { Tag } from '../models/tag';

export const findAllTags = async (options?: Record<string, any>) => {
  const tagList = await Tag.findAll();
  const tags = appendTagList(tagList);
  return tags;
};

const appendTagList = (articleTags: any[], article?) => {
  const tagList = articleTags.map((tag) => tag.name);
  if (!article) return tagList;
  // article.dataValues.tagList = tagList;
  return [];
};
