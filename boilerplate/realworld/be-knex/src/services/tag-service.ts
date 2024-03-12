import { tagsRepo } from '../repositories/tags-repository';

export const findAllTags = async (options?: Record<string, any>) => {
  const tagList = await tagsRepo.findAll();
  // const tags = convertToTagList(tagList);
  return tagList;
};

export const tagService = {
  findAllTags,
};
