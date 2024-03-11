import { tagRepo } from '../repositories/tag-repository';

export const findAllTags = async (options?: Record<string, any>) => {
  const tagList = await tagRepo.findAll();
  // const tags = convertToTagList(tagList);
  return tagList;
};

export const tagService = {
  findAllTags,
};
