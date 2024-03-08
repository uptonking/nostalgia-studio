import React, { useCallback, useMemo } from 'react';

import { Link } from 'react-router-dom';

import { deleteComment } from '../../api/comments-api';
import type { ArticleAction } from '../../reducers/article';
import type { CommentType, UserType } from '../../types';
import { getDateISOStrWithTimezone } from '../../utils/common';
import { AVATAR_IMAGE_FALLBACK } from '../../utils/constants';

type CommentProps = {
  comment: CommentType;
  slug: string;
  user: UserType | null;
  dispatch: React.Dispatch<ArticleAction>;
};

export function Comment({ comment, slug, user, dispatch }: CommentProps) {
  const showDeleteButton = useMemo(
    () => user && user.username === comment.author.username,
    [comment.author.username, user],
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteComment(slug, comment.id);
      dispatch({ type: 'DELETE_COMMENT', commentId: comment.id });
    } catch (error) {
      console.log(error);
    }
  }, [comment.id, dispatch, slug]);

  const createdDateText = useMemo(
    () => getDateISOStrWithTimezone(new Date(comment.createdAt).getTime()),
    [comment.createdAt],
  );

  return (
    <div className='card comment-item'>
      <div className='card-block'>
        <p className='card-text'>{comment.body}</p>
      </div>
      <div className='card-footer'>
        <Link
          to={`/profile/${comment.author.username}`}
          className='comment-author'
        >
          <img
            src={comment.author.image || AVATAR_IMAGE_FALLBACK}
            className='comment-author-img'
            alt={comment.author.username}
          />
          &nbsp;
          {comment.author.username}
        </Link>
        <span
          className='date-posted'
          title={createdDateText.slice(0, 19).replace('T', ' ')}
        >
          {createdDateText.slice(0, 16).replace('T', ' ')}
        </span>
        {showDeleteButton && (
          <button
            className='mod-options btn-outline-secondary'
            onClick={handleDelete}
            title='Delete Comment'
          >
            X
          </button>
        )}
      </div>
    </div>
  );
}

export default Comment;
