import type { NextFunction, Request, Response } from 'express';

import { Tag } from '../models/tag';
import { User } from '../models/user';
import { findAllArticles } from '../services/article-service';

export const getAllArticles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { author, tag, favorited, limit = 5, offset = 0 } = req.query;
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

    let articles = { rows: [], count: 0 };
    if (favorited) {
      // const user = await User.findOne({ where: { username: favorited } });
      // articles.rows = await user.getFavorites(searchOptions);
      // articles.count = await user.countFavorites();
    } else {
      articles = await findAllArticles(searchOptions);
    }

    // for (const article of articles.rows) {
    //   const articleTags = await article.getTagList();
    // appendTagList(articleTags, article);
    // await appendFollowers(loggedUser, article);
    // await appendFavorites(loggedUser, article);
    //   delete article.dataValues.Favorites;
    // }

    return res
      .status(200)
      .json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};
