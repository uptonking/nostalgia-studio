import type { ArticleType, CommentType } from '../types';

export type ArticleAction =
  | { type: 'FETCH_ARTICLE_START' }
  | {
      type: 'FETCH_ARTICLE_SUCCESS';
      payload: { article: ArticleType; comments: CommentType[] };
    }
  | { type: 'FETCH_ARTICLE_ERROR'; error: unknown }
  | { type: 'ARTICLE_FAVORITED'; payload: { article: ArticleType } }
  | { type: 'ARTICLE_UNFAVORITED'; payload: { article: ArticleType } }
  | { type: 'ADD_COMMENT'; payload: { comment: CommentType } }
  | { type: 'DELETE_COMMENT'; commentId: number }
  | { type: 'FOLLOW_AUTHOR' }
  | { type: 'UNFOLLOW_AUTHOR' };

export interface ArticleState {
  article: ArticleType | null;
  comments: Array<CommentType>;
  loading: boolean;
  error: unknown;
}

export const initialState: ArticleState = {
  article: null,
  comments: [],
  loading: false,
  error: null,
};

export function articleReducer(
  state: ArticleState,
  action: ArticleAction,
): ArticleState {
  switch (action.type) {
    case 'FETCH_ARTICLE_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_ARTICLE_SUCCESS':
      return {
        ...state,
        loading: false,
        article: action.payload.article,
        comments: action.payload.comments,
      };
    case 'FETCH_ARTICLE_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
        article: null,
      };
    case 'ARTICLE_FAVORITED':
    case 'ARTICLE_UNFAVORITED':
      return {
        ...state,
        article: state.article && {
          ...state.article,
          favorited: action.payload.article.favorited,
          favoritesCount: action.payload.article.favoritesCount,
        },
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [action.payload.comment, ...state.comments],
      };
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(
          (comment) => comment.id !== action.commentId,
        ),
      };
    case 'FOLLOW_AUTHOR':
    case 'UNFOLLOW_AUTHOR':
      return {
        ...state,
        article: state.article && {
          ...state.article,
          author: {
            ...state.article.author,
            following: !state.article.author.following,
          },
        },
      };
    default:
      return state;
  }
}
