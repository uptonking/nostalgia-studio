import type { NextFunction, Request, Response } from 'express';

import { findOneArticleBySlug } from '../services/article-service';
import {
  addCommentToArticle,
  findArticleComments,
  findCommentById,
} from '../services/comment-service';
import {
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
} from '../utils/api-error';

export const getArticleComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // const { loggedUser } = req;
    const { slug } = req.params;

    const article = await findOneArticleBySlug(slug);
    if (!article) throw new NotFoundError('Article ' + slug);

    const comments = await findArticleComments(article);

    // for (const comment of comments) {
    //   await appendFollowers(loggedUser, comment);
    // }

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    const { slug } = req.params;
    const { body } = req.body.comment;
    if (!body) throw new FieldRequiredError('Comment body');

    const article = await findOneArticleBySlug(slug);
    if (!article) throw new NotFoundError('Article ' + slug);

    const comment = await addCommentToArticle(body, article.id, user.id);

    // delete loggedUser.dataValues.token;
    comment.dataValues.author = user;
    // await appendFollowers(loggedUser, loggedUser);

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

export const removeComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    const { commentId } = req.params;

    const comment = await findCommentById(commentId);
    if (!comment) throw new NotFoundError('Comment');

    if (user.id !== comment.userId) {
      throw new ForbiddenError('comment');
    }

    await comment.destroy();

    res.json({ message: { body: ['Comment deleted successfully'] } });
  } catch (error) {
    next(error);
  }
};
