import * as React from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../hooks/use-auth-provider';
import type { ArticleAction } from '../../reducers/article';
import type { CommentType } from '../../types';
import { Comment } from './comment';
import { CommentInput } from './comment-input';

type CommentContainerProps = {
  comments: Array<CommentType>;
  slug: string;
  dispatch: React.Dispatch<ArticleAction>;
};

export function CommentContainer({
  comments,
  slug,
  dispatch,
}: CommentContainerProps) {
  const {
    state: { user },
  } = useAuth();

  return (
    <div className='row'>
      <div className='col-xs-12 col-md-10 offset-md-1'>
        {user ? (
          <CommentInput user={user} slug={slug} dispatch={dispatch} />
        ) : (
          <div className='flex-center-h comment-login-hint'>
            <p>
              <Link to='/login' className='brand-primary mr-xs'>
                Sign in
              </Link>
              <span className='mr-xs'> or </span>
              <Link to='/register' className='brand-primary mr-xs'>
                Sign up
              </Link>
              to comment articles and follow authors ❤️️
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            slug={slug}
            user={user}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(CommentContainer);
