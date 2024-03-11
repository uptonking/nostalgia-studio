import { Article } from '../models/article';
import { Tag } from '../models/tag';
import { User } from '../models/user';
import { AlreadyTakenError, NotFoundError } from '../utils/api-error';
import { findOneUser } from './user-service';

export const findAllArticles = async (options: any) => {
  const { author, tag, favorited, limit = 5, offset = 0 } = options;

  const searchOptions = {
    include: [
      {
        model: Tag,
        as: 'tagList',
        attributes: ['name'],
        ...(tag && { where: { name: tag } }),
      },
      {
        model: User,
        as: 'author',
        attributes: { exclude: ['email'] },
        ...(author && { where: { username: author } }),
      },
    ],
    limit: parseInt(limit as string, 10),
    offset: Number(offset) * Number(limit),
    order: [['createdAt', 'DESC']],
  };

  // @ts-expect-error fix-types
  return await Article.findAndCountAll(searchOptions);
};

export const findOneArticleBySlug = async (
  slug: string,
  enableInclude = false,
) => {
  const includeOptions = [
    { model: Tag, as: 'tagList', attributes: ['name'] },
    { model: User, as: 'author', attributes: { exclude: ['email'] } },
  ];

  const article = await Article.findOne({
    where: { slug },
    ...(enableInclude && { include: includeOptions }),
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
  const article = await Article.create({
    title,
    slug,
    description,
    body,
  });

  for (const tag of tagList) {
    const tagInDB = await Tag.findByPk(tag.trim());
    if (tagInDB) {
      // @ts-expect-error fix-types
      await article.addTagList(tagInDB);
    } else if (tag.length > 2) {
      const newTag = await Tag.create({ name: tag.trim() });
      // @ts-expect-error fix-types
      await article.addTagList(newTag);
    }
  }

  const _user = await findOneUser({ email: user.email });
  delete _user.dataValues.token;
  // @ts-expect-error fix-types
  article.setAuthor(_user);

  article.dataValues.tagList = tagList;
  article.dataValues.author = user;
  // await appendFollowers(loggedUser, loggedUser);
  // await appendFavorites(loggedUser, article);

  return article;
};
