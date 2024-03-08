import { Router } from 'express';

import {
  createArticle,
  getAllArticles,
  getOneArticleBySlug,
} from '../../controllers/article-controller';
import { requireUser } from '../../middleware/requires-user';
import { commentRouter } from './comment-route';

export const articleRouter = Router();

// All Articles - by Author/by Tag/Favorited by user
articleRouter.get('/', getAllArticles);
articleRouter.get('/:slug', getOneArticleBySlug);
// Create Article
articleRouter.post('/', requireUser, createArticle);

// articleRouter.get("/feed",  articlesFeed);

// 💬 comments
articleRouter.use('/', commentRouter);

/**
 * @swagger
 * tags:
 *   name: Article
 *   description: users' articles
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get all article, return recent articles by default
 *     description: Use query parameters to filter results. Auth is optional
 *     tags: [Article]
 *     requestBody:
 *       required: false
 *     responses:
 *       "200":
 *         description: OK
 *
 */
