import type { CommentType } from '../types';
import API from './api-utils';

type Comment = {
  comment: CommentType;
};

type Comments = {
  comments: Array<CommentType>;
};

export function createComment(slug: string, comment: { body: string }) {
  return API.post<Comment>(`/articles/${slug}/comments`, { comment });
}

export function deleteComment(slug: string, commentId: number) {
  return API.delete<null>(`/articles/${slug}/comments/${commentId}`);
}

export function getArticleComments(slug: string) {
  return API.get<Comments>(`/articles/${slug}/comments`);
  // return mockApi.getArticleComments(slug);
}
