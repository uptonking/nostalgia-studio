import * as React from 'react';

import { Link } from 'react-router-dom';

import type { ArticleListAction } from '../reducers/article-feed';
import type { IArticle } from '../types';
import { AuthorAvatar } from './common/author-avatar';
import { ArticleTags } from './common/article-tags';
import { FavoriteButton } from './common/favorite-button';

type ArticlePreviewProps = {
  article: IArticle;
  dispatch: React.Dispatch<ArticleListAction>;
};

function generateSummaryDescriptionFromArticle(content: string) {
  if (content && content.length > 40) {
    return content.slice(0, 32);
  }

  return content;
}

export function ArticlePreview({ article, dispatch }: ArticlePreviewProps) {
  return (
    <div className='article-preview'>
      <div className='article-meta'>
        <AuthorAvatar article={article} />
        <div className='pull-xs-right'>
          <FavoriteButton article={article} dispatch={dispatch}>
            {article.favoritesCount}
          </FavoriteButton>
        </div>
      </div>

      <Link to={`/article/${article.slug}`} className='preview-link'>
        <h1>{article.title}</h1>
        {/* <p>{article.description}</p> */}
        <p>
          {article.description
            ? article.description
            : generateSummaryDescriptionFromArticle(article.body)}
        </p>
        <span>Read more...</span>
        <ArticleTags tagList={article.tagList} />
      </Link>
    </div>
  );
}

export default ArticlePreview;
