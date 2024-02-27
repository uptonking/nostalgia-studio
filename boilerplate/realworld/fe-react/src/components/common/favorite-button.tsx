import * as React from 'react';

import cx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';

import { favoriteArticle, unfavoriteArticle } from '../../api/article-api';
import type { ArticleAction } from '../../reducers/article';
import type { ArticleListAction } from '../../reducers/article-feed';
import type { IArticle } from '../../types';

type FavoriteButtonProps = {
  article: IArticle;
  dispatch: React.Dispatch<ArticleAction & ArticleListAction>;
  children: React.ReactNode;
  user?: any;
};

export function FavoriteButton({
  article,
  dispatch,
  children,
  user,
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(true);
    if (article.favorited) {
      const payload = await unfavoriteArticle(article.slug);
      dispatch({
        type: 'ARTICLE_UNFAVORITED',
        payload: payload.data,
      });
    } else {
      const payload = await favoriteArticle(article.slug);
      dispatch({
        type: 'ARTICLE_FAVORITED',
        payload: payload.data,
      });
    }
    setLoading(false);
  };

  const classNames = ['btn', 'btn-sm'];

  if (article.favorited) {
    classNames.push('btn-primary');
  } else {
    classNames.push('btn-outline-primary');
  }

  return (
    <button
      className={cx('article-fav', 'btn', 'btn-sm', {
        'btn-primary': article.favorited,
        'btn-outline-primary': !article.favorited,
      })}
      onClick={handleClick}
      disabled={loading}
      title='likes count'
    >
      <i className='ion-heart' />
      &nbsp;
      {children}
    </button>
  );
}

export default FavoriteButton;
