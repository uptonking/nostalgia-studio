import type { IComment } from '../types';
import API from './api-utils';
import mockApi from './mock-api';

type Comment = {
  comment: IComment;
};

type Comments = {
  comments: Array<IComment>;
};

export function createComment(slug: string, comment: { body: string }) {
  return API.post<Comment>(`/articles/${slug}/comments`, { comment });
}

export function deleteComment(slug: string, commentId: number) {
  return API.delete<null>(`/articles/${slug}/comments/${commentId}`);
}

export function getArticleComments(slug: string) {
  // return API.get<Comments>(`/articles/${slug}/comments`);

  return mockApi.getArticleComments(slug);
}
