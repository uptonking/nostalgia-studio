import type { Article } from '../models/article';
import { User } from '../models/user';
import { Comment } from '../models/comment';

export const findArticleComments = async (article: Article) => {
  // @ts-expect-error fix-types
  const comments = await article.getComments({
    include: [
      { model: User, as: 'author', attributes: { exclude: ['email'] } },
    ],
  });

  return comments;
};

export const findCommentById = async (id) => {
  const comment = await Comment.findByPk(id);

  return comment;
};

export const addCommentToArticle = async (content, articleId, userId) => {
  const comment = await Comment.create({
    body: content,
    articleId: articleId,
    userId,
  });

  return comment;
};
