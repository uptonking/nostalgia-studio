import * as React from 'react';

import type { ArticleListAction } from '../reducers/articles-materials';

type ListPaginationProps = {
  page?: number;
  pageSize?: number;
  articlesCount: number;
  dispatch: React.Dispatch<ArticleListAction>;
};

export function ListPagination({
  page = 0,
  pageSize = 10,
  articlesCount,
  dispatch,
}: ListPaginationProps) {
  const pageNumbers = [];

  for (let i = 0; i < Math.ceil(articlesCount / pageSize); ++i) {
    pageNumbers.push(i);
  }

  if (articlesCount <= pageSize) {
    return null;
  }

  return (
    <nav>
      <div className='pagination'>
        {pageNumbers.map((number) => {
          const isCurrent = number === page;
          return (
            <li
              className={isCurrent ? 'page-item active' : 'page-item'}
              onClick={() => dispatch({ type: 'SET_PAGE', page: number })}
              key={number}
            >
              <button className='page-link'>{number + 1}</button>
            </li>
          );
        })}
      </div>
    </nav>
  );
}

export default ListPagination;
