import React, { useCallback } from 'react';

import {
  NextLink,
  PageLink,
  Pagination,
  PreviousLink,
} from '@strapi/design-system/v2';

import { getPaginationList } from '../utils/get-pagination-list';

type TrailsTablePaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  pageCount: number;
  setPage: (...args: any[]) => any;
};

export function TrailsTablePagination(props: TrailsTablePaginationProps) {
  const { page, pageCount, setPage } = props;

  const pageList = getPaginationList(page, pageCount);

  const handleClick = useCallback(
    (event, newPage) => {
      event.preventDefault();
      if (page !== newPage) {
        setPage(newPage);
      }
    },
    [page, setPage],
  );

  return (
    <Pagination activePage={page} pageCount={pageCount}>
      <PreviousLink
        href={`#${page - 1}`}
        onClick={(event) => handleClick(event, page - 1)}
      >
        Go to previous page
      </PreviousLink>
      {pageList.map((pageNum) => (
        <PageLink
          key={pageNum}
          number={pageNum}
          href={`#${pageNum}`}
          onClick={(event) => handleClick(event, pageNum)}
        >
          Go to page ${pageNum}
        </PageLink>
      ))}
      <NextLink
        href={`#${page + 1}`}
        onClick={(event) => handleClick(event, page + 1)}
      >
        Go to next page
      </NextLink>
    </Pagination>
  );
}
