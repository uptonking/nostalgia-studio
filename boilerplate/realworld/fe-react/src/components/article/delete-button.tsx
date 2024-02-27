import * as React from 'react';

import { useNavigate } from 'react-router-dom';

import { deleteArticle } from '../../api/article-api';
import type { IArticle } from '../../types';

export function DeleteButton({ article }: { article: IArticle }) {
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
      className='btn btn-outline-danger btn-sm mr-sm'
      onClick={handleDelete}
    >
      <i className='ion-trash-a' /> Delete Article
    </button>
  );
}

export default DeleteButton;
