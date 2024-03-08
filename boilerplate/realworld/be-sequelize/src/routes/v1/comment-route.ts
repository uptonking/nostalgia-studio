import { Router } from 'express';

import {
  createComment,
  getArticleComments,
  removeComment,
} from '../../controllers/comment-controller';
import { requireUser } from '../../middleware';

export const commentRouter = Router();

// Get all comments for an article
commentRouter.get('/:slug/comments', getArticleComments);
// Create comment
commentRouter.post('/:slug/comments', requireUser, createComment);
// Remove Comment
commentRouter.delete('/:slug/comments/:commentId', requireUser, removeComment);
