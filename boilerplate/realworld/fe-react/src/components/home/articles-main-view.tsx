import * as React from 'react';

import type { TabType } from '../../reducers/article-feed';
import { ArticlesFeed } from '../articles-feed';
import { TabList } from '../common/tab-list';

const tabsData: Array<TabType> = [
  { type: 'FEED', label: 'Following' },
  { type: 'ALL', label: 'For You' },
];

export function ArticlesMainView() {
  return (
    <div className='col-md-9'>
      <div className='feed-toggle'>
        <TabList data={tabsData} />
      </div>
      <ArticlesFeed />
    </div>
  );
}

export default ArticlesMainView;
