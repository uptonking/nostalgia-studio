import * as React from 'react';

import { ArticlesFeedProvider } from '../../context/articles';
import { MainView } from './main-view';
import { Tags } from './tags';

export function Home() {
  return (
    <div className='home-page'>
      {/* <Banner /> */}
      <div className='container page'>
        <div className='row'>
          <ArticlesFeedProvider>
            <MainView />
            <Tags />
          </ArticlesFeedProvider>
        </div>
      </div>
    </div>
  );
}

export default Home;
