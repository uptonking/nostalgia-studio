import React, { useEffect, useRef, useState } from 'react';

import { css } from '@linaria/core';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ReactTableDevtools } from '@tanstack/react-table-devtools';

import { tableBaseCss } from '../examples.styles';
import { makeData, type Person } from '../utils/makeData';

const SORT_DIRECTION_ICONS = {
  asc: ' 🔼',
  desc: ' 🔽',
} as const;

/**
 * ✨ sort
 * - sort时表格数据未修改，仅改变state
 * - 排序规则: 文本列默认 asc > desc > false; 数字列默认 desc > asc > false
 */
export const A1b4Sort = () => {
  const rerender = React.useReducer(() => ({}), {})[1];

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        header: 'Name',
        footer: (props) => props.column.id,
        columns: [
          {
            accessorKey: 'firstName',
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.lastName,
            id: 'lastName',
            cell: (info) => info.getValue(),
            header: () => <span>Last Name</span>,
            footer: (props) => props.column.id,
          },
        ],
      },
      {
        header: 'Info',
        footer: (props) => props.column.id,
        columns: [
          {
            accessorKey: 'age',
            header: () => 'Age',
            footer: (props) => props.column.id,
          },
          {
            header: 'More Info',
            columns: [
              {
                accessorKey: 'visits',
                header: () => <span>Visits</span>,
                footer: (props) => props.column.id,
              },
              {
                accessorKey: 'status',
                header: 'Status',
                footer: (props) => props.column.id,
              },
              {
                accessorKey: 'progress',
                header: 'Profile Progress',
                footer: (props) => props.column.id,
              },
            ],
          },
          {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: (info) => (info.getValue() as Date).toISOString(),
          },
        ],
      },
    ],
    [],
  );

  // 💡 sort时表格数据未修改
  const [data, setData] = React.useState(() => makeData(30));
  const refreshData = () => setData(() => makeData(30));

  const [sorting, setSorting] = React.useState<SortingState>([]);

  console.log(';; app-react-core1 ', sorting);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  console.log(';; app-react-core2 ', sorting, table.getState().sorting);

  return (
    <div className={tableBaseCss}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? sortedHeaderCss
                            : '',
                          // 🤔 注意before/after的值相同;
                          // 文本列默认 asc > desc > false; 数字列默认 desc > asc > false
                          onClick: (e) => {
                            console.log(
                              ';; beforeSort-curr-next ',
                              header.column.id,
                              header.column.getIsSorted(),
                              header.column.getNextSortingOrder(),
                            );
                            header.column.getToggleSortingHandler()(e);
                            console.log(
                              ';; afterSort--curr-next ',
                              header.column.id,
                              header.column.getIsSorted(),
                              header.column.getNextSortingOrder(),
                            );
                          },
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {SORT_DIRECTION_ICONS[
                          header.column.getIsSorted() as string
                        ] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice(0, 10)
            .map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
      <div>{table.getRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>
      <pre>{JSON.stringify(sorting, null, 2)}</pre>
      <ReactTableDevtools
        table={table}
        // initialIsOpen={true}
        initialIsOpen={true}
      />
    </div>
  );
};

const sortedHeaderCss = css`
  cursor: pointer;
  user-select: none;
`;
