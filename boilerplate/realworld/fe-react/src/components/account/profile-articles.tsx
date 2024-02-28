import React, { useEffect, useReducer } from 'react';

import { ArticlesFeedProvider } from '../../context/articles';
import { useAuth } from '../../context/auth';
import type { ITab } from '../../reducers/article-feed';
import { ArticlesFeed } from '../articles-feed';
import { TabList } from '../common/tab-list';

export function ProfileArticles({ username }: { username: string }) {
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

  // const userProfileInitialState: ArticleListState = {
  //   articles: [],
  //   loading: false,
  //   error: null,
  //   articlesCount: 0,
  //   page: 0,
  //   pageSize: 5,
  //   selectedTab: { type: 'AUTHORED', label: 'Articles', username },
  // };
  // const [state, dispatch] = useReducer(
  //   articlesReducer,
  //   userProfileInitialState,
  // );

  return (
    <ArticlesFeedProvider>
      <div className='container'>
        <div className='row'>
          <div className='col-xs-12 col-md-10 offset-md-1'>
            <div className='articles-toggle'>
              <TabList data={tabsData} />
            </div>
            <ArticlesFeed />
          </div>
        </div>
      </div>
    </ArticlesFeedProvider>
  );
}

export default React.memo(ProfileArticles);
