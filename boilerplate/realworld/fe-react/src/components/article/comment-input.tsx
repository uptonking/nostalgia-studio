import React, { useState } from 'react';

import { createComment } from '../../api/comments-api';
import type { ArticleAction } from '../../reducers/article';
import type { IUser } from '../../types';
import { AVATAR_IMAGE_FALLBACK } from '../../utils/constants';

type CommentInputProps = {
  user: IUser;
  slug: string;
  dispatch: React.Dispatch<ArticleAction>;
};

export function CommentInput({ user, slug, dispatch }: CommentInputProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = await createComment(slug, { body });
      dispatch({ type: 'ADD_COMMENT', payload: payload.data });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
    setBody('');
  };

  return (
    <form className='card comment-form' onSubmit={handleSubmit}>
      <div className='card-block'>
        <textarea
          className='form-control'
          placeholder='Write a comment...'
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
        />
      </div>
      <div className='card-footer'>
        <img
          src={user.image || AVATAR_IMAGE_FALLBACK}
          className='comment-author-img'
          alt={user.username}
        />
        <button
          className='btn btn-sm btn-primary btn-brand-primary'
          type='submit'
          disabled={loading}
        >
          Comment
        </button>
      </div>
    </form>
  );
}

export default CommentInput;
