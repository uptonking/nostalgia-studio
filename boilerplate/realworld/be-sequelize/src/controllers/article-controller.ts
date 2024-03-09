import type { NextFunction, Request, Response } from 'express';

import {
  addArticle,
  findAllArticles,
  findOneArticleBySlug,
  findSlug,
} from '../services/article-service';
import {
  AlreadyTakenError,
  FieldRequiredError,
  NotFoundError,
} from '../utils/api-error';
import { convertToTagList, slugify } from '../utils/article';

export const getAllArticles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { author, tag, favorited, limit = 5, offset = 0 } = req.query;

    let articles = { rows: [], count: 0 };
    if (favorited) {
      // const user = await User.findOne({ where: { username: favorited } });
      // articles.rows = await user.getFavorites(searchOptions);
      // articles.count = await user.countFavorites();
      res.status(200).json({ articles: [], articlesCount: 0 });
    } else {
      articles = await findAllArticles(req.query);
    }

    for (const article of articles.rows) {
      const articleTags = await article.getTagList();
      convertToTagList(articleTags, article);
      // await appendFollowers(loggedUser, article);
      // await appendFavorites(loggedUser, article);
      delete article.dataValues.Favorites;
    }

    res
      .status(200)
      .json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

export const getOneArticleBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // const user = req.user;
    const { slug } = req.params;
    const article = await findOneArticleBySlug(slug, true);
    if (!article) throw new NotFoundError('Article ' + slug);

    // @ts-expect-error fix-types
    convertToTagList(article.tagList, article);
    // await appendFollowers(loggedUser, article);
    // await appendFavorites(loggedUser, article);

    res.status(200).json({ article });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    // if (!user) throw new UnauthorizedError();

    const { title, description, body, tagList } = req.body.article;
    if (!title) throw new FieldRequiredError('title');
    if (!description) throw new FieldRequiredError('description');
    if (!body) throw new FieldRequiredError('article body');

    const slug = slugify(title);
    const slugInDB = await findSlug(slug);
    if (slugInDB) throw new AlreadyTakenError('Article with Title ' + slug);

    const article = await addArticle(
      {
        title,
        slug,
        description,
        body,
        tagList,
      },
      user,
    );

    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
};
