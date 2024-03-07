import { Router } from 'express';

import {
  getAllArticles,
  getOneArticleBySlug,
  createArticle,
} from '../../controllers/article-controller';
import { requireUser } from '../../middleware/requires-user';

export const articleRouter = Router();

// All Articles - by Author/by Tag/Favorited by user
articleRouter.get('/', getAllArticles);
// Create Article
// articleRouter.post('/', requireUser, newArticle);
articleRouter.post('/', createArticle);
// articleRouter.get('/:slug', requireUser, getArticleBySlug);
articleRouter.get('/:slug', getOneArticleBySlug);

// articleRouter.get("/feed",  articlesFeed);

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
