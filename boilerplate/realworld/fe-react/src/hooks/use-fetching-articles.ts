import { useEffect } from 'react';

import {
  getArticles,
  getArticlesByAuthor,
  getArticlesByTag,
  getArticlesFavoritedBy,
  getFeedArticles,
} from '../api/article-api';
import type { TabType } from '../reducers/articles-materials';
import { useArticlesFeed } from './use-articles-provider';

const loadArticles = (tab: TabType, page = 0) => {
  switch (tab.type) {
    case 'FEED':
      return getFeedArticles();
    case 'ALL':
      return getArticles(page);
    case 'TAG':
      return getArticlesByTag(tab.label, page);
    case 'AUTHORED':
      return getArticlesByAuthor(tab.username, page);
    case 'FAVORITES':
      return getArticlesFavoritedBy(tab.username, page);
    default:
      // return getArticles(page);
      throw new Error('type does not exist');
  }
};

export const useFetchingArticles = () => {
  const {
    state: {
      articles,
      loading,
      error,
      articlesCount,
      selectedTab,
      page,
      pageSize,
    },
    dispatch,
  } = useArticlesFeed();

  useEffect(() => {
    let ignore = false;
    async function fetchArticles() {
      dispatch({ type: 'FETCH_ARTICLES_START' });
      try {
        // console.log('==selectedTab, ', selectedTab);
        // console.log('==page, ', page);
        const payload = await loadArticles(selectedTab, page);
        if (!ignore) {
          dispatch({
            type: 'FETCH_ARTICLES_SUCCESS',
            payload: (payload as any).data,
          });
        }
      } catch (error) {
        if (!ignore) {
          // @ts-expect-error fix-types
          dispatch({ type: 'FETCH_ARTICLES_ERROR', error });
        }
      }
    }
    fetchArticles();
    return () => {
      ignore = true;
    };
  }, [dispatch, page, selectedTab]);

  return {
    state: {
      articles,
      loading,
      articlesCount,
      page,
      pageSize,
    },
    dispatch,
  };
};
