import { Router } from 'express';

import { articleController } from '../controllers/article-controller';
import { authorizeUser } from '../middlewares/auth';

export const articleRouter = Router();

// get all articles - filterable by author/tag/favorited
articleRouter.get('/', articleController.getAllArticles);
// get one article
articleRouter.get('/:slug', articleController.getArticleBySlug);
// create one article
articleRouter.post('/', authorizeUser(), articleController.createArticle);

// articleRouter.get("/feed",  articlesFeed);

// 💬 comments
// articleRouter.use('/', commentRouter);
