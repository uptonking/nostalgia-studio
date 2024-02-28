import React, { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { followProfile, unfollowProfile } from '../../api/profile-api';
import { useAuth } from '../../context/auth';
import type { ArticleAction } from '../../reducers/article';
import type { IArticle } from '../../types';
import { FavoriteButton } from '../common/favorite-button';
import { FollowUserButton } from '../common/follow-user-button';
import { DeleteButton } from './delete-button';

type ArticleActionsProps = {
  article: IArticle;
  dispatch: React.Dispatch<ArticleAction>;
};

export function ArticleActions({ article, dispatch }: ArticleActionsProps) {
  const {
    state: { user },
  } = useAuth();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const canModifyArticle = user && user.username === article.author.username;

  const handleFollowButtonClick = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(true);
    if (article.author.following) {
      await followProfile(article.author.username);
      dispatch({ type: 'UNFOLLOW_AUTHOR' });
    } else {
      await unfollowProfile(article.author.username);
      dispatch({ type: 'FOLLOW_AUTHOR' });
    }
    setLoading(false);
  };

  return canModifyArticle ? (
    // 📝
    <React.Fragment>
      <Link
        to={`/editor/${article.slug}`}
        className='btn btn-outline-secondary btn-sm mr-sm flex-center-h article-action-btn article-edit-btn'
      >
        {/* <i className='ion-edit' />  */}
        Edit Article
      </Link>
      <DeleteButton article={article} />
    </React.Fragment>
  ) : (
    // ❤️️
    <React.Fragment>
      <FollowUserButton
        onClick={handleFollowButtonClick}
        profile={article.author}
        loading={loading}
      />
      <FavoriteButton article={article} dispatch={dispatch} user={user}>
        <span className='mr-xs'>{article.favorited ? 'Unlike' : 'Like'}</span>
        {article.favoritesCount}
      </FavoriteButton>
    </React.Fragment>
  );
}

export default ArticleActions;
