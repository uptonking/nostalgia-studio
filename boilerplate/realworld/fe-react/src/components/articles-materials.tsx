import React from 'react';

import { useFetchingArticles } from '../hooks/use-fetching-articles';
import { ArticlePreview } from './article-preview';
import { ListPagination } from './list-pagination';

export function ArticlesMaterials() {
  const {
    state: { articles, loading, articlesCount, page, pageSize },
    dispatch,
  } = useFetchingArticles();

  if (loading) {
    return <div className='article-preview'>Loading articles...</div>;
  }

  if (articles.length === 0) {
    return <div className='article-preview'>No articles yet</div>;
  }

  // console.log('==ArticleList, ', articles);
  return (
    <React.Fragment>
      {articles.map((article, index) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          dispatch={dispatch}
        />
      ))}
      <ListPagination
        page={page}
        pageSize={pageSize}
        articlesCount={articlesCount}
        dispatch={dispatch}
      />
    </React.Fragment>
  );
}

export default ArticlesMaterials;
