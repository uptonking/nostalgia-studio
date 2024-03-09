import React, { useEffect, useLayoutEffect, useReducer } from 'react';

import {
  ArticlesFeedProvider,
  useArticlesFeed,
} from '../../hooks/use-articles-provider';
import { useAuth } from '../../hooks/use-auth-provider';
import type { TabType } from '../../reducers/articles-materials';
import { ArticlesMaterials } from '../articles-materials';
import { TabList } from '../common/tab-list';

export function ProfileArticles({ username }: { username: string }) {
  // const { state: { user }, } = useAuth();
  const {
    state: { selectedTab },
    dispatch,
  } = useArticlesFeed();

  const tabsData: Array<TabType> = [
    { type: 'AUTHORED', label: 'Articles', username },
    {
      type: 'FAVORITES',
      label: 'Favorited',
      username,
    },
  ];

  useLayoutEffect(() => {
    if (['ALL', 'FEED', 'TAG'].includes(selectedTab.type)) {
      dispatch({
        type: 'SET_TAB',
        tab: { type: 'AUTHORED', label: 'Articles', username },
      });
    }
  }, [dispatch, selectedTab.type, username]);

  return (
    <div className='container'>
      <div className='row'>
        <div className='col-xs-12 col-md-10 offset-md-1'>
          <div className='articles-toggle'>
            <TabList data={tabsData} />
          </div>
          <ArticlesMaterials />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProfileArticles);
