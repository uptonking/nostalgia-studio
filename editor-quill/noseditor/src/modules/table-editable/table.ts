import type { Blot } from 'parchment';
import Quill from 'quill';
import type DeltaType from 'quill-delta';
import type DefaultModule from 'quill/src/core/module';

import type { KeyboardBindingOption } from '../../types/table';
import {
  genCellId,
  genRowId,
  TableBody,
  TableCell,
  TableCellLine,
  TableCol,
  TableColGroup,
  TableContainer,
  TableRow,
  TableViewWrapper,
} from './formats-table';
import { TableColumnTool } from './table-column-tool';
import { TableContextMenu } from './table-context-menu';
import { TableSelection } from './table-selection';
import { getEventComposedPath, ifInTableCell } from './utils/common';
import {
  matchTable,
  matchTableCell,
  matchTableHeader,
} from './utils/node-matchers';

type TableEditableOptions = {
  operationMenu?: any;
};

const Module = Quill.import('core/module') as typeof DefaultModule;
const Delta = Quill.import('delta') as typeof DeltaType;

export class TableEditable extends Module {
  static keyboardBindings: Record<string, KeyboardBindingOption>;

  static register() {
    Quill.register(TableCol, true);
    Quill.register(TableColGroup, true);
    Quill.register(TableCellLine, true);
    Quill.register(TableCell, true);
    Quill.register(TableRow, true);
    Quill.register(TableBody, true);
    Quill.register(TableContainer, true);
    Quill.register(TableViewWrapper, true);
    Quill.register(TableViewWrapper, true);
    // register customized Header，overwriting quill built-in Header
    // Quill.register('formats/header', Header, true);
  }

  tableRoot: HTMLElement;
  tableSelection: TableSelection;
  tableOperationMenu: TableContextMenu;
  columnTool: TableColumnTool;

  constructor(quill: Quill, options) {
    super(quill, options);

    // show/hide table tools
    this.quill.root.addEventListener(
      'click',
      (evt) => {
        const path = getEventComposedPath(evt);

        if (!path || path.length <= 0) return;

        const tableNode = path.filter((node) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TABLE' &&
            node.classList.contains('quill-better-table')
          );
        })[0];

        if (tableNode) {
          // current table clicked
          if (this.tableRoot === tableNode) return;
          // other table clicked
          if (this.tableRoot) this.hideTableTools();
          this.showTableTools(tableNode, quill, options);
        } else if (this.tableRoot) {
          // other clicked
          this.hideTableTools();
        }
      },
      false,
    );

    // handle right click on quill-better-table
    this.quill.root.addEventListener(
      'contextmenu',
      (evt) => {
        if (!this.tableRoot) return true;
        evt.preventDefault();

        const path = getEventComposedPath(evt);
        if (!path || path.length <= 0) return;

        const tableNode = path.filter((node) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TABLE' &&
            node.classList.contains('quill-better-table')
          );
        })[0];

        const rowNode = path.filter((node) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TR' &&
            node.getAttribute('data-row')
          );
        })[0];

        const cellNode = path.filter((node) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TD' &&
            node.getAttribute('data-row')
          );
        })[0];

        const isTargetCellSelected = this.tableSelection.selectedTds
          .map((tableCell) => tableCell.domNode)
          .includes(cellNode);

        if (
          this.tableSelection.selectedTds.length <= 0 ||
          !isTargetCellSelected
        ) {
          this.tableSelection.setSelection(
            cellNode.getBoundingClientRect(),
            cellNode.getBoundingClientRect(),
          );
        }

        if (this.tableOperationMenu)
          this.tableOperationMenu = this.tableOperationMenu.destroy();

        if (tableNode) {
          this.tableOperationMenu = new TableContextMenu(
            {
              table: tableNode,
              row: rowNode,
              cell: cellNode,
              left: evt.pageX,
              top: evt.pageY,
            },
            quill,
            options.operationMenu,
          );
        }
      },
      false,
    );

    // add keyboard binding：Backspace
    // prevent user hits backspace to delete table cell
    quill.keyboard.addBinding({ key: 'Backspace' }, {}, (range, context) => {
      if (range.index === 0 || this.quill.getLength() <= 1) return true;
      const [line] = this.quill.getLine(range.index);
      if (context.offset === 0) {
        const [prev] = this.quill.getLine(range.index - 1);
        if (prev != null) {
          if (
            prev.statics.blotName === 'table-cell-line' &&
            line.statics.blotName !== 'table-cell-line'
          )
            return false;
        }
      }
      return true;
    });
    // since only one matched bindings callback will excute.
    // expected my binding callback excute first
    // I changed the order of binding callbacks
    const thisBinding = quill.keyboard.bindings['Backspace'].pop();
    quill.keyboard.bindings['Backspace'].splice(0, 1, thisBinding);

    // add Matchers to match and render quill-better-table for initialization
    // or pasting
    quill.clipboard.addMatcher('td', matchTableCell);
    quill.clipboard.addMatcher('th', matchTableHeader);
    quill.clipboard.addMatcher('table', matchTable);
    // quill.clipboard.addMatcher('h1, h2, h3, h4, h5, h6', matchHeader)

    // remove matcher for tr tag
    quill.clipboard.matchers = quill.clipboard.matchers.filter((matcher) => {
      return matcher[0] !== 'tr';
    });
  }

  getTable(range = this.quill.getSelection()) {
    if (!range) return [null, null, null, -1];
    const [cellLine, offset] = this.quill.getLine(range.index);
    if (
      cellLine == null ||
      cellLine.statics.blotName !== TableCellLine.blotName
    ) {
      return [null, null, null, -1];
    }
    // @ts-expect-error fix-types
    const cell = cellLine.tableCell();
    const row = cell.row();
    const table = row.table();
    return [table, row, cell, offset];
  }

  insertTable(rows, columns) {
    const range = this.quill.getSelection(true);
    if (!range) return;
    const currentBlot = this.quill.getLeaf(range.index)[0];
    if (ifInTableCell(currentBlot)) {
      console.warn(`Can not insert table into a table cell.`);
      return;
    }

    let delta = new Delta().retain(range.index);
    delta.insert('\n');
    // insert table column
    delta = Array(columns)
      .fill('\n')
      .reduce((deltas, text) => {
        deltas.insert(text, { 'table-col': true });
        return deltas;
      }, delta);
    // insert table cell line with empty line
    delta = Array(rows)
      .fill(0)
      .reduce((tr) => {
        const trId = genRowId();
        return Array(columns)
          .fill('\n')
          .reduce((deltas, text) => {
            deltas.insert(text, {
              'table-cell-line': { row: trId, cell: genCellId() },
            });
            return deltas;
          }, tr);
      }, delta);

    // console.log(';; insert-tbl ', delta);

    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index + columns + 1, Quill.sources.API);
  }

  showTableTools(table, quill, options) {
    this.tableRoot = table;
    this.columnTool = new TableColumnTool(table, quill, options);
    this.tableSelection = new TableSelection(table, quill, options);
  }

  hideTableTools() {
    if (this.columnTool) this.columnTool.destroy();
    if (this.tableSelection) this.tableSelection.destroy();
    if (this.tableOperationMenu) this.tableOperationMenu.destroy();
    this.columnTool = null;
    this.tableSelection = null;
    this.tableOperationMenu = null;
    this.tableRoot = null;
  }
}

TableEditable.keyboardBindings = {
  'table-cell-line backspace': {
    key: 'Backspace',
    format: ['table-cell-line'],
    collapsed: true,
    offset: 0,
    handler(range, context) {
      // @ts-expect-error fix-types
      const [line, offset] = this.quill.getLine(range.index);
      if (!line.prev || line.prev.statics.blotName !== 'table-cell-line') {
        return false;
      }
      return true;
    },
  },

  'table-cell-line delete': {
    key: 'Delete',
    format: ['table-cell-line'],
    collapsed: true,
    suffix: /^$/,
    handler() {},
  },

  'table-cell-line enter': {
    key: 'Enter',
    shiftKey: null,
    format: ['table-cell-line'],
    handler(this: TableEditable, range, context) {
      // bugfix: a unexpected new line inserted when user compositionend with hitting Enter
      if (this.quill.selection && this.quill.selection.composing) return;
      // @ts-expect-error fix-types
      const Scope = Quill.imports.parchment.Scope;
      if (range.length > 0) {
        this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
      }
      const lineFormats = Object.keys(context.format).reduce(
        (formats, format) => {
          if (
            this.quill.scroll.query(format, Scope.BLOCK) &&
            !Array.isArray(context.format[format])
          ) {
            formats[format] = context.format[format];
          }
          return formats;
        },
        {},
      );
      // insert new cellLine with lineFormats
      this.quill.insertText(
        range.index,
        '\n',
        lineFormats['table-cell-line'],
        Quill.sources.USER,
      );
      // Earlier scroll.deleteAt might have messed up our selection,
      // so insertText's built in selection preservation is not reliable
      this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
      this.quill.focus();
      Object.keys(context.format).forEach((name) => {
        if (lineFormats[name] != null) return;
        if (Array.isArray(context.format[name])) return;
        if (name === 'link') return;
        this.quill.format(name, context.format[name], Quill.sources.USER);
      });
    },
  },

  'table-cell-line up': makeTableArrowHandler(true),
  'table-cell-line down': makeTableArrowHandler(false),
  'down-to-table': {
    key: 'ArrowDown',
    collapsed: true,
    handler(this: TableEditable, range, context) {
      const target = context.line.next;
      if (target && target.statics.blotName === 'table-view') {
        const targetCell = target.table().rows()[0].children.head;
        const targetLine = targetCell.children.head;

        this.quill.setSelection(
          targetLine.offset(this.quill.scroll),
          0,
          Quill.sources.USER,
        );

        return false;
      }
      return true;
    },
  },
  'up-to-table': {
    key: 'ArrowUp',
    collapsed: true,
    handler(this: TableEditable, range, context) {
      const target = context.line.prev;
      if (target && target.statics.blotName === 'table-view') {
        const rows = target.table().rows();
        const targetCell = rows[rows.length - 1].children.head;
        const targetLine = targetCell.children.head;

        this.quill.setSelection(
          targetLine.offset(this.quill.scroll),
          0,
          Quill.sources.USER,
        );

        return false;
      }
      return true;
    },
  },
};

function makeTableArrowHandler(up) {
  return {
    key: up ? 'ArrowUp' : 'ArrowDown',
    collapsed: true,
    format: ['table-cell-line'],
    handler(this: TableEditable, range, context) {
      // TODO move to table module
      const key = up ? 'prev' : 'next';
      const targetLine = context.line[key];
      if (targetLine != null) return true;

      const cell = context.line.parent;
      const targetRow = cell.parent[key];

      if (targetRow != null && targetRow.statics.blotName === 'table-row') {
        let targetCell = targetRow.children.head;
        let totalColspanOfTargetCell = parseInt(
          targetCell.formats()['colspan'],
          10,
        );
        let cur = cell;
        let totalColspanOfCur = parseInt(cur.formats()['colspan'], 10);

        // get targetCell above current cell depends on colspan
        while (cur.prev != null) {
          cur = cur.prev;
          totalColspanOfCur += parseInt(cur.formats()['colspan'], 10);
        }

        while (
          targetCell.next != null &&
          totalColspanOfTargetCell < totalColspanOfCur
        ) {
          targetCell = targetCell.next;
          totalColspanOfTargetCell += parseInt(
            targetCell.formats()['colspan'],
            10,
          );
        }

        const index = targetCell.offset(this.quill.scroll);
        this.quill.setSelection(index, 0, Quill.sources.USER);
      } else {
        const targetLine = cell.table().parent[key];
        if (targetLine != null) {
          if (up) {
            this.quill.setSelection(
              targetLine.offset(this.quill.scroll) + targetLine.length() - 1,
              0,
              Quill.sources.USER,
            );
          } else {
            this.quill.setSelection(
              targetLine.offset(this.quill.scroll),
              0,
              Quill.sources.USER,
            );
          }
        }
      }
      return false;
    },
  };
}

export default TableEditable;
