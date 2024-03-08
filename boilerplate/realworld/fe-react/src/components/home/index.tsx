import * as React from 'react';

import { ArticlesFeedProvider } from '../../hooks/use-articles-provider';
import { ArticlesMainView } from './articles-main-view';
import { TagsPopular } from './tags-popular';

export function Home() {
  return (
    <div className='home-page'>
      {/* <Banner /> */}
      <div className='container page'>
        <div className='row'>
          <ArticlesFeedProvider>
            <ArticlesMainView />
            <TagsPopular />
          </ArticlesFeedProvider>
        </div>
      </div>
    </div>
  );
}

export default Home;
