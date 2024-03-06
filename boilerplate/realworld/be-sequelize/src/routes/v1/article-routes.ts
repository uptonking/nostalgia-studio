import { Router } from 'express';

import { getAllArticles } from '../../controllers/article-controller';

export const articleRouter = Router();

articleRouter.get('/', getAllArticles);

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
