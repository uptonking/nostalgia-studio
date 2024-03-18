import { h, type VNode } from 'snabbdom';

import {
  type Row,
  type RowData,
  type Table,
  type TableOptionsResolved,
} from '@tanstack/table-core';

import { type Watarble } from '../../watarble';
import { modelNodeToVnode } from '../render-element';
import { customRender } from '../utils';
import { sortedHeaderCss, tableBaseCss } from './table.styles';

type TableElemNode = { type: 'table'; children: Row<RowData>[] };

const SORT_DIRECTION_ICONS = {
  asc: ' 🔼',
  desc: ' 🔽',
} as const;

export const tableConfig = {
  type: 'table',
  renderFn: (elemNode: TableElemNode, watarble: Watarble): VNode => {
    const rows = elemNode.children || [];
    // console.log(';; tb ', children);

    const borderColor =
      watarble.state.getters.getOutlineBorderColor() || '#000';

    const vnode = h(
      'div',
      { class: { [tableBaseCss]: true } },
      h(
        'div',
        {
          class: { idTable: true },
          style: {
            width: watarble.state.getters.getTotalSize() + 'px',
          },
        },
        [
          // / theader
          h(
            'div',
            {},
            watarble.state.getters.getTableHeaderGroups().map((headerGroup) => {
              return h(
                'div',
                {
                  key: headerGroup.id,
                  class: { idTr: true },
                  style: {
                    position: 'relative',
                    height: '32px',
                  },
                },
                headerGroup.headers.map((header) => {
                  // console.log(
                  //   ';; th ',
                  //   header,
                  //   flexRender(
                  //     header.column.columnDef.header,
                  //     header.getContext(),
                  //   ),
                  // );

                  return h(
                    'div',
                    {
                      key: header.id,
                      class: { thTd: true },
                      style: {
                        position: 'absolute',
                        left: header.getStart() + 'px',
                        width: header.getSize() + 'px',
                        // use fixed height to make empty th filled
                        height: '32px',
                      },
                    },
                    header.isPlaceholder
                      ? []
                      : h(
                          'div',
                          {
                            class: {
                              [sortedHeaderCss]: header.column.getCanSort(),
                            },
                            on: {
                              click: (e) => {
                                // console.log(
                                //   ';; beforeSort-curr-next ',
                                //   header.column.id,
                                //   header.column.getIsSorted(),
                                //   header.column.getNextSortingOrder(),
                                // );
                                header.column.getToggleSortingHandler()(e);
                                // console.log(
                                //   ';; afterSort--curr-next ',
                                //   header.column.id,
                                //   header.column.getIsSorted(),
                                //   header.column.getNextSortingOrder(),
                                // );
                              },
                            },
                          },
                          [
                            customRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            ),
                            SORT_DIRECTION_ICONS[
                              String(header.column.getIsSorted())
                            ] ?? '',
                          ],
                        ),
                  );
                }),
              );
            }),
          ),
          // / body-rows
          ...rows.map((row, index: number) => {
            // console.log(';; tr ', row);

            return h(
              'div',
              {
                class: { idTr: true },
                style: {
                  position: 'relative',
                  display: 'flex',
                  height: '32px',
                },
                key: row.id,
              },
              row.getVisibleCells().map((cell) => {
                // console.log(';; td ', cell, flexRender(cell.column.columnDef.cell, cell.getContext()),);

                return h(
                  'div',
                  {
                    key: cell.id,
                    class: { thTd: true },
                    style: {
                      position: 'absolute',
                      padding: '0.5rem',
                      left: cell.column.getStart() + 'px',
                      width: cell.column.getSize() + 'px',
                      borderColor: borderColor,
                    },
                  },
                  customRender(cell.column.columnDef.cell, cell.getContext()),
                );
              }),
            );
          }),
        ],
      ),
    );

    // console.log(';; tb-vnode ', vnode);

    return vnode;
  },
};

export const tableConfig1 = {
  type: 'table1',
  renderFn: (elemNode, watarble): VNode => {
    const children = elemNode.children || [];
    const vnode = h(
      'table',
      h(
        'tbody',
        children.map((child: Node, index: number) => {
          return modelNodeToVnode(child, watarble);
        }),
      ),
    );
    return vnode;
  },
};

export const rowConfig = {
  type: 'tableRow',
  renderFn: (elemNode, watarble): VNode => {
    const children = elemNode.children || [];
    const vnode = h(
      'tr',
      children.map((child: Node, index: number) => {
        return modelNodeToVnode(child, watarble);
      }),
    );
    return vnode;
  },
};

export const cellConfig = {
  type: 'tableCell',
  renderFn(elemNode, watarble): VNode {
    const { children = [], colSpan = 1, rowSpan = 1 } = elemNode;
    const vnode = h(
      'td',
      { colSpan, rowSpan },
      children.map((child: Node, index: number) => {
        return modelNodeToVnode(child, watarble);
      }),
    );
    return vnode;
  },
};
