import { db } from '../db/connection';

export const findIdsByNames = async (names?: any[]) => {
  const tags = await db('tags').select('id').whereIn('name', names);
  return tags;
};

export const findAll = async (options?) => {
  const tags = await db('tags').pluck('name');
  return tags;
};

export const findExistingTagsInTagList = async (tagList: any[]) => {
  const tags = await db('tags').select('id', 'name').whereIn('name', tagList);
  return tags;
};

export const insertOne = async (options?: any) => {
  const tags = await db('tags').pluck('name');
  return tags;
};

export const insertNames = async (tags?: any[]) => {
  const _tags = await db('tags').insert(tags);
  return _tags;
};

export const tagsRepo = {
  findAll,
  findIdsByNames,
  findExistingTagsInTagList,
  insertNames,
  insertOne,
};
