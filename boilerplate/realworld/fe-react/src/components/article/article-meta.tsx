import * as React from 'react';

import { Flex, Grid, View } from '@adobe/react-spectrum';

import type { ArticleAction } from '../../reducers/article';
import ArticleActions from './article-actions';
import AuthorAvatar from '../common/author-avatar';
import type { IArticle } from '../../types';

type ArticleMetaProps = {
  article: IArticle;
  dispatch: React.Dispatch<ArticleAction>;
};

function ArticleMeta({ article, dispatch }: ArticleMetaProps) {
  return (
    <Flex gap='size-100' alignItems='end'>
      <AuthorAvatar article={article} />
      <ArticleActions article={article} dispatch={dispatch} />
    </Flex>
  );
}

export default React.memo(ArticleMeta);
