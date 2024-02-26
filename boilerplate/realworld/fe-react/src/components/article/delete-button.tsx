import * as React from 'react';

import type { IArticle } from '../../types';
import { deleteArticle } from '../../api/article-api';
import { useNavigate } from 'react-router-dom';

export default function DeleteButton({ article }: { article: IArticle }) {
  const navigate = useNavigate();
  const handleDelete = async () => {
    try {
      await deleteArticle(article.slug);
      navigate('/');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <button
      style={{ height: '28px' }}
      className='btn btn-outline-danger btn-sm'
      onClick={handleDelete}
    >
      <i className='ion-trash-a' /> Delete Article
    </button>
  );
}
