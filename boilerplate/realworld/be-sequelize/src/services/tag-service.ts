import { Tag } from '../models/tag';
import { convertToTagList } from '../utils/article';

export const findAllTags = async (options?: Record<string, any>) => {
  const tagList = await Tag.findAll();
  const tags = convertToTagList(tagList);
  return tags;
};
