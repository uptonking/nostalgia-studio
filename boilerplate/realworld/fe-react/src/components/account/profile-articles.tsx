import * as React from 'react';

import {
  type ArticleListState,
  type ITab,
  articlesReducer,
} from '../../reducers/article-feed';
import { useEffect, useReducer } from 'react';

import ArticlesFeed from '../articles-feed';
import { ArticlesFeedProvider } from '../../context/articles';
import TabList from '../common/tab-list';
import { useAuth } from '../../context/auth';

function ProfileArticles({ username }: { username: string }) {
  const {
    state: { user },
  } = useAuth();

  const authorLabel = `${
    user && user.username === username ? 'My ' : ''
  }Articles`;

  const tabsData: Array<ITab> = [
    { type: 'AUTHORED', label: authorLabel, username },
    {
      type: 'FAVORITES',
      label: 'Favorited Articles',
      username,
    },
  ];

  const userProfileInitialState: ArticleListState = {
    articles: [],
    loading: false,
    error: null,
    articlesCount: 0,
    page: 0,
    pageSize: 5,
    selectedTab: { type: 'AUTHORED', label: 'Articles', username },
  };

  const [state, dispatch] = useReducer(
    articlesReducer,
    userProfileInitialState,
  );

  return (
    <ArticlesFeedProvider value={{ state, dispatch }}>
      <TabList data={tabsData} />
      <ArticlesFeed />
    </ArticlesFeedProvider>
  );
}

export default React.memo(ProfileArticles);
