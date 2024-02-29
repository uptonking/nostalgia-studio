import React, { useMemo } from 'react';

import { Link } from 'react-router-dom';

import { deleteComment } from '../../api/comments-api';
import type { ArticleAction } from '../../reducers/article';
import type { IComment, IUser } from '../../types';
import { getDateISOStrWithTimezone } from '../../utils/common';

type CommentProps = {
  comment: IComment;
  slug: string;
  user: IUser | null;
  dispatch: React.Dispatch<ArticleAction>;
};

export function Comment({ comment, slug, user, dispatch }: CommentProps) {
  const showDeleteButton = user && user.username === comment.author.username;

  const handleDelete = async () => {
    try {
      await deleteComment(slug, comment.id);
      dispatch({ type: 'DELETE_COMMENT', commentId: comment.id });
    } catch (error) {
      console.log(error);
    }
  };

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
        <Link to={`/@${comment.author.username}`} className='comment-author'>
          <img
            src={comment.author.image}
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
          <span className='mod-options'>
            <i className='ion-trash-a' onClick={handleDelete} />
          </span>
        )}
      </div>
    </div>
  );
}

export default Comment;
