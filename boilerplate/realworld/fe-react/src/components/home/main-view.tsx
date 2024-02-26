import * as React from 'react';

import { useAuth } from '../../context/auth';
import type { ITab } from '../../reducers/article-feed';
import { ArticlesFeed } from '../articles-feed';
import { TabList } from '../common/tab-list';

const tabsData: Array<ITab> = [
  { type: 'FEED', label: 'Following' },
  // random/换一换 feature
  { type: 'ALL', label: 'For You' },
];

export function MainView() {
  const {
    state: { user },
  } = useAuth();

  const tabData = user ? tabsData : [tabsData[1]];

  return (
    <div className='col-md-9'>
      <div className='feed-toggle'>
        <TabList data={tabData} />
      </div>
      <ArticlesFeed />
    </div>
  );
}

export default MainView;
