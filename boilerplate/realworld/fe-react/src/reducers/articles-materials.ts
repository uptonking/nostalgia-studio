import type { ArticleType } from '../types';

export type ArticleListAction =
  | { type: 'FETCH_ARTICLES_START' }
  | {
      type: 'FETCH_ARTICLES_SUCCESS';
      payload: { articles: Array<ArticleType>; articlesCount: number };
    }
  | { type: 'FETCH_ARTICLES_ERROR'; error: string }
  | { type: 'ARTICLE_FAVORITED'; payload: { article: ArticleType } }
  | { type: 'ARTICLE_UNFAVORITED'; payload: { article: ArticleType } }
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_PAGE'; page: number };

export type TabType =
  | { type: 'ALL'; label: string }
  | { type: 'FEED'; label: string }
  | { type: 'TAG'; label: string }
  | { type: 'AUTHORED'; label: string; username?: string }
  | { type: 'FAVORITES'; label: string; username?: string };

export interface ArticleListState {
  articles: Array<ArticleType>;
  loading: boolean;
  error: string | null;
  articlesCount: number;
  selectedTab: TabType;
  page: number;
  pageSize?: number;
}

export const initialState: ArticleListState = {
  articles: [],
  loading: false,
  error: null,
  articlesCount: 0,
  page: 0,
  pageSize: 10,
  selectedTab: { type: 'ALL', label: 'For You' },
};

export function articlesReducer(
  state: ArticleListState,
  action: ArticleListAction,
): ArticleListState {
  switch (action.type) {
    case 'FETCH_ARTICLES_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_ARTICLES_SUCCESS':
      return {
        ...state,
        loading: false,
        articles: action.payload.articles,
        articlesCount: action.payload.articlesCount,
      };
    case 'FETCH_ARTICLES_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
        articles: [],
      };
    case 'ARTICLE_FAVORITED':
    case 'ARTICLE_UNFAVORITED':
      return {
        ...state,
        articles: state.articles.map((article) =>
          article.slug === action.payload.article.slug
            ? {
                ...article,
                favorited: action.payload.article.favorited,
                favoritesCount: action.payload.article.favoritesCount,
              }
            : article,
        ),
      };
    case 'SET_TAB':
      return {
        ...state,
        selectedTab: action.tab,
        page: 0,
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.page,
      };
    default:
      return state;
  }
}
