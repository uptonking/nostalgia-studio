import * as React from 'react';

import cx from 'clsx';

import type { ArticleAction } from '../../reducers/article';
import type { ArticleType } from '../../types';
import { AuthorAvatar } from '../common/author-avatar';
import { ArticleActions } from './article-actions';

type ArticleMetaProps = {
  article: ArticleType;
  dispatch: React.Dispatch<ArticleAction>;
  className?: string;
};

export function ArticleMeta({
  article,
  dispatch,
  className,
}: ArticleMetaProps) {
  return (
    <div className={cx('article-meta', className)}>
      <AuthorAvatar article={article} />
      <ArticleActions article={article} dispatch={dispatch} />
    </div>
  );
}

export default React.memo(ArticleMeta);
