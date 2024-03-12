import { articlesRepo } from '../repositories/articles-repository';
import { articlesTagsRepo } from '../repositories/articles-tags-repository';
import { tagsRepo } from '../repositories/tags-repository';

export const findAllArticles = async (options: any) => {
  return await articlesRepo.findAndCountAll(options);
};

export const findOneArticleBySlug = async (
  slug: string,
  enableInclude = false,
) => {
  // const includeOptions = [
  //   { model: Tag, as: 'tagList', attributes: ['name'] },
  // ];

  const article = await articlesRepo.findOneBySlug(slug);

  return article;
};

export const addArticle = async (
  {
    title,
    slug,
    description,
    body,
    tagList,
  }: {
    title: string;
    slug: string;
    description: string;
    body: string;
    tagList: string[];
  },
  user,
) => {
  const article = await articlesRepo.insertOne({
    title,
    slug,
    description,
    body,
    author: user.id,
  });

  // console.log(';; article ', article);

  if (tagList && tagList.length > 0) {
    const existingTags = await tagsRepo.findExistingTagsInTagList(tagList);
    // console.log(';; tag ', existingTags);
    const newTagsToInsert = tagList
      .filter((tag) => !existingTags.find((t) => t.name === tag))
      .map((tag) => ({ name: tag }));

    if (newTagsToInsert.length > 0) {
      await tagsRepo.insertNames(newTagsToInsert);
    }

    const tagsIdsToInsert = await tagsRepo.findIdsByNames(tagList);
    // console.log(';; tagsIdsToInsert ', tagsIdsToInsert);
    const articlesTags = tagsIdsToInsert.map((tagId) => ({
      // @ts-expect-error fix-types
      article: article.id,
      tag: tagId.id,
    }));
    await articlesTagsRepo.insertMany(articlesTags);
  }

  // article.setAuthor(_user);
  // article['author'] = user.id;
  // article['author']['following'] = user;
  // article['favorited'] = false;

  return article;
};

export const articleService = {
  findAllArticles,
  addArticle,
  findOneArticleBySlug,
};
