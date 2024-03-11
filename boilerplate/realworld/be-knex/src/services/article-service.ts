import { articleRepo } from '../repositories/article-repository';

export const findAllArticles = async (options: any) => {
  const { author, tag, favorited, limit = 5, offset = 0 } = options;

  return await articleRepo.findAndCountAll(options);
};

export const findOneArticleBySlug = async (
  slug: string,
  enableInclude = false,
) => {
  // const includeOptions = [
  //   { model: Tag, as: 'tagList', attributes: ['name'] },
  // ];

  const article = await articleRepo.findOneBySlug({
    where: { slug },
    // ...(enableInclude && { include: includeOptions }),
  });

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
  const article = await articleRepo.createOne({
    title,
    slug,
    description,
    body,
  });

  console.log(';; article ', article);

  // for (const tag of tagList) {
  //   const tagInDB = await Tag.findByPk(tag.trim());
  //   if (tagInDB) {
  //     await article.addTagList(tagInDB);
  //   } else if (tag.length > 2) {
  //     const newTag = await Tag.create({ name: tag.trim() });
  //     await article.addTagList(newTag);
  //   }
  // }

  // article.setAuthor(_user);
  article['author'] = user;
  article['author']['following'] = user;
  article['favorited'] = false;

  return article;
};

export const articleService = {
  findAllArticles,
  addArticle,
  findOneArticleBySlug,
};
