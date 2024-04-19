import Quill from 'quill';
import type DefaultBlock from 'quill/src/blots/block';
import type DefaultBreak from 'quill/src/blots/break';
import type DefaultContainer from 'quill/src/blots/container';

import type TableEditable from './table';
import { getRelativeRect } from './utils/common';

const Break = Quill.import('blots/break') as typeof DefaultBreak;
const Block = Quill.import('blots/block') as typeof DefaultBlock;
const Container = Quill.import('blots/container') as typeof DefaultContainer;

export const CELL_IDENTITY_KEYS = ['row', 'cell'] as const;
export const CELL_ATTRIBUTES = ['rowspan', 'colspan'];
const CELL_DEFAULT = {
  rowspan: 1,
  colspan: 1,
} as const;
const colAttributes = ['width'] as const;
const colDefaultOptions = { width: 120 } as const;
const errorLimit = 5;

/** inside cell */
export class TableCellLine extends Block {
  static create(value) {
    const node = super.create(value);
    CELL_IDENTITY_KEYS.forEach((key) => {
      const genId = key === 'row' ? genRowId : genCellId;
      node.setAttribute(`data-${key}`, value[key] || genId());
    });
    CELL_ATTRIBUTES.forEach((attrName) => {
      node.setAttribute(
        `data-${attrName}`,
        value[attrName] || CELL_DEFAULT[attrName],
      );
    });

    if (value['cell-bg']) {
      node.setAttribute('data-cell-bg', value['cell-bg']);
    }

    return node;
  }

  static formats(domNode) {
    const formats = {};

    return [...CELL_ATTRIBUTES, ...CELL_IDENTITY_KEYS, 'cell-bg'].reduce(
      (formats, attr) => {
        if (domNode.hasAttribute(`data-${attr}`)) {
          formats[attr] = domNode.getAttribute(`data-${attr}`) || undefined;
        }
        return formats;
      },
      formats,
    );
  }

  format(name, value) {
    if ([...CELL_ATTRIBUTES, ...CELL_IDENTITY_KEYS].indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(`data-${name}`, value);
      } else {
        this.domNode.removeAttribute(`data-${name}`);
      }
    } else if (name === 'cell-bg') {
      if (value) {
        this.domNode.setAttribute('data-cell-bg', value);
      } else {
        this.domNode.removeAttribute('data-cell-bg');
      }
    } else if (name === 'header') {
      if (!value) return;
      // @ts-expect-error fix-types
      const { row, cell, rowspan, colspan } = TableCellLine.formats(
        this.domNode,
      );
      super.format(name, {
        value,
        row,
        cell,
        rowspan,
        colspan,
      });
    } else {
      super.format(name, value);
    }
  }

  optimize(context) {
    // cover shadowBlot's wrap call, pass params parentBlot initialize needed
    const rowId = this.domNode.getAttribute('data-row');
    const rowspan = this.domNode.getAttribute('data-rowspan');
    const colspan = this.domNode.getAttribute('data-colspan');
    const cellBg = this.domNode.getAttribute('data-cell-bg');
    if (
      this.statics.requiredContainer &&
      !(this.parent instanceof this.statics.requiredContainer)
    ) {
      this.wrap(this.statics.requiredContainer.blotName, {
        row: rowId,
        colspan,
        rowspan,
        'cell-bg': cellBg,
      });
    }
    super.optimize(context);
  }

  tableCell() {
    return this.parent;
  }
}
TableCellLine.blotName = 'table-cell-line';
TableCellLine.className = 'qlbt-cell-line';
TableCellLine.tagName = 'P';

/** create table cell td */
export class TableCell extends Container {
  static create(value) {
    const node = super.create(value) as HTMLElement;
    node.setAttribute('data-row', value.row);

    CELL_ATTRIBUTES.forEach((attrName) => {
      if (value[attrName]) {
        node.setAttribute(attrName, value[attrName]);
      }
    });

    if (value['cell-bg']) {
      node.setAttribute('data-cell-bg', value['cell-bg']);
      node.style.backgroundColor = value['cell-bg'];
    }

    return node;
  }

  static formats(domNode) {
    const formats = {};

    if (domNode.hasAttribute('data-row')) {
      formats['row'] = domNode.getAttribute('data-row');
    }

    if (domNode.hasAttribute('data-cell-bg')) {
      formats['cell-bg'] = domNode.getAttribute('data-cell-bg');
    }

    return CELL_ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }

      return formats;
    }, formats);
  }

  checkMerge() {
    // table中允许List之后，输入有序列表报错 this.children.head.formats没有
    if (
      super.checkMerge() &&
      this.next.children.head != null &&
      // @ts-expect-error fix-types
      this.children.head.formats &&
      // @ts-expect-error fix-types
      this.children.tail.formats &&
      // @ts-expect-error fix-types
      this.next.children.head.formats &&
      // @ts-expect-error fix-types
      this.next.children.tail.formats
    ) {
      const thisHead =
        // @ts-expect-error fix-types
        this.children.head.formats()[this.children.head.statics.blotName];
      const thisTail =
        // @ts-expect-error fix-types
        this.children.tail.formats()[this.children.tail.statics.blotName];
      const nextHead =
        // @ts-expect-error fix-types
        this.next.children.head.formats()[
          this.next.children.head.statics.blotName
        ];
      const nextTail =
        // @ts-expect-error fix-types
        this.next.children.tail.formats()[
          this.next.children.tail.statics.blotName
        ];
      // table中允许List之后，输入有序列表报错，添加非空校验
      if (thisHead && thisTail && nextHead && nextTail) {
        return (
          thisHead.cell === thisTail.cell &&
          thisHead.cell === nextHead.cell &&
          thisHead.cell === nextTail.cell
        );
      }
    }
    return false;
  }

  cellOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  formats() {
    const formats = {};

    if (this.domNode.hasAttribute('data-row')) {
      formats['row'] = this.domNode.getAttribute('data-row');
    }

    if (this.domNode.hasAttribute('data-cell-bg')) {
      formats['cell-bg'] = this.domNode.getAttribute('data-cell-bg');
    }

    return CELL_ATTRIBUTES.reduce((formats, attribute) => {
      if (this.domNode.hasAttribute(attribute)) {
        formats[attribute] = this.domNode.getAttribute(attribute);
      }

      return formats;
    }, formats);
  }

  toggleAttribute(name, value) {
    if (value) {
      this.domNode.setAttribute(name, value);
    } else {
      this.domNode.removeAttribute(name);
    }
  }

  formatChildren(name, value) {
    this.children.forEach((child) => {
      // @ts-expect-error fix-types
      child.format(name, value);
    });
  }

  format(name, value) {
    if (CELL_ATTRIBUTES.indexOf(name) > -1) {
      this.toggleAttribute(name, value);
      this.formatChildren(name, value);
    } else if (['row'].indexOf(name) > -1) {
      this.toggleAttribute(`data-${name}`, value);
      this.formatChildren(name, value);
    } else if (name === 'cell-bg') {
      this.toggleAttribute('data-cell-bg', value);
      this.formatChildren(name, value);

      if (value) {
        this.domNode.style.backgroundColor = value;
      } else {
        this.domNode.style.backgroundColor = 'initial';
      }
    } else {
      // @ts-expect-error fix-types
      super.format(name, value);
    }
  }

  optimize(context) {
    const rowId = this.domNode.getAttribute('data-row');

    if (
      this.statics.requiredContainer &&
      !(this.parent instanceof this.statics.requiredContainer)
    ) {
      this.wrap(this.statics.requiredContainer.blotName, {
        row: rowId,
      });
    }
    super.optimize(context);
  }

  row() {
    return this.parent;
  }

  rowOffset() {
    if (this.row()) {
      // @ts-expect-error fix-types
      return this.row().rowOffset();
    }
    return -1;
  }

  table() {
    // @ts-expect-error fix-types
    return this.row() && this.row().table();
  }
}
// todo name
TableCell.blotName = 'table';
TableCell.tagName = 'TD';

export class TableRow extends Container {
  static create(value) {
    const node = super.create(value) as HTMLElement;
    node.setAttribute('data-row', value.row);
    return node;
  }

  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
      // @ts-expect-error fix-types
      const thisHead = this.children.head.formats();
      // @ts-expect-error fix-types
      const thisTail = this.children.tail.formats();
      // @ts-expect-error fix-types
      const nextHead = this.next.children.head.formats();
      // @ts-expect-error fix-types
      const nextTail = this.next.children.tail.formats();

      return (
        thisHead.row === thisTail.row &&
        thisHead.row === nextHead.row &&
        thisHead.row === nextTail.row
      );
    }
    return false;
  }

  formats() {
    return ['row'].reduce((formats, attrName) => {
      if (this.domNode.hasAttribute(`data-${attrName}`)) {
        formats[attrName] = this.domNode.getAttribute(`data-${attrName}`);
      }
      return formats;
    }, {});
  }

  optimize(context) {
    // optimize function of ShadowBlot
    if (
      this.statics.requiredContainer &&
      !(this.parent instanceof this.statics.requiredContainer)
    ) {
      this.wrap(this.statics.requiredContainer.blotName);
    }

    // optimize function of ParentBlot
    // note: modified this optimize function because
    // TableRow should not be removed when the length of its children was 0
    this.enforceAllowedChildren();
    if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }

    // optimize function of ContainerBlot
    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
  }

  rowOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  table() {
    return this.parent && this.parent.parent;
  }
}
TableRow.blotName = 'table-row';
TableRow.tagName = 'TR';

export class TableBody extends Container {}
TableBody.blotName = 'table-body';
TableBody.tagName = 'TBODY';

export class Header extends Block {
  static create(value) {
    if (typeof value === 'string') {
      value = { value };
    }

    const node = super.create(value.value);

    CELL_IDENTITY_KEYS.forEach((key) => {
      if (value[key]) node.setAttribute(`data-${key}`, value[key]);
    });

    CELL_ATTRIBUTES.forEach((key) => {
      if (value[key]) node.setAttribute(`data-${key}`, value[key]);
    });

    return node;
  }

  static formats(domNode) {
    const formats: Record<string, any> = {};
    formats.value = this.tagName.indexOf(domNode.tagName) + 1;

    return CELL_ATTRIBUTES.concat(CELL_IDENTITY_KEYS).reduce(
      (formats, attribute) => {
        if (domNode.hasAttribute(`data-${attribute}`)) {
          formats[attribute] =
            domNode.getAttribute(`data-${attribute}`) || undefined;
        }
        return formats;
      },
      formats,
    );
  }

  format(name, value) {
    const { row, cell, rowspan, colspan } = Header.formats(this.domNode);
    if (name === Header.blotName) {
      if (value) {
        super.format(name, {
          value,
          row,
          cell,
          rowspan,
          colspan,
        });
      } else {
        if (row) {
          this.replaceWith(TableCellLine.blotName, {
            row,
            cell,
            rowspan,
            colspan,
          });
        } else {
          super.format(name, value);
        }
      }
    } else {
      super.format(name, value);
    }
  }

  optimize(context) {
    const { row, rowspan, colspan } = Header.formats(this.domNode);

    if (row && !(this.parent instanceof TableCell)) {
      this.wrap(TableCell.blotName, {
        row,
        colspan,
        rowspan,
      });
    }

    // ShadowBlot optimize
    this.enforceAllowedChildren();
    if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }
    if (this.children.length === 0) {
      if (this.statics.defaultChild != null) {
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
        // TODO double check if necessary
        // child.optimize(context);
      } else {
        this.remove();
      }
    }
    // Block optimize
    this.cache = {};
  }
}
// todo th
Header.blotName = 'header';
Header.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export class TableCol extends Block {
  static create(value) {
    const node = super.create(value);
    colAttributes.forEach((attrName) => {
      node.setAttribute(
        `${attrName}`,
        value[attrName] || colDefaultOptions[attrName],
      );
    });
    return node;
  }

  static formats(domNode) {
    return colAttributes.reduce((formats, attribute) => {
      if (domNode.hasAttribute(`${attribute}`)) {
        formats[attribute] = domNode.getAttribute(`${attribute}`) || undefined;
      }
      return formats;
    }, {});
  }

  format(name, value) {
    if (colAttributes.indexOf(name) > -1) {
      this.domNode.setAttribute(`${name}`, value || colDefaultOptions[name]);
    } else {
      super.format(name, value);
    }
  }

  html() {
    return this.domNode.outerHTML;
  }
}
TableCol.blotName = 'table-col';
TableCol.tagName = 'col';

export class TableColGroup extends Container {}
TableColGroup.blotName = 'table-col-group';
TableColGroup.tagName = 'colgroup';

export class TableContainer extends Container {
  static create() {
    const node = super.create();
    return node;
  }

  constructor(scroll, domNode) {
    super(scroll, domNode);
    this.updateTableWidth();
  }

  updateTableWidth() {
    // todo replace setTimeout
    setTimeout(() => {
      const colGroup = this.colGroup();
      if (!colGroup) return;
      // @ts-expect-error fix-types
      const tableWidth = colGroup.children.reduce((sumWidth, col) => {
        const colWidth =
          col.formats()[TableCol.blotName]?.width || colDefaultOptions.width;
        sumWidth = sumWidth + parseInt(colWidth, 10);
        return sumWidth;
      }, 0);
      this.domNode.style.width = `${tableWidth}px`;
    }, 0);
  }

  cells(column) {
    return this.rows().map((row) => row.children.at(column));
  }

  colGroup() {
    return this.children.head;
  }

  deleteColumns(compareRect, delIndexes = [], editorWrapper) {
    const [body] = this.descendants(TableBody);
    if (body == null || body.children.head == null) return;

    const tableCells = this.descendants(TableCell);
    const removedCells = [];
    const modifiedCells = [];

    tableCells.forEach((cell) => {
      const cellRect = getRelativeRect(
        cell.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      if (
        cellRect.x + errorLimit > compareRect.x &&
        cellRect.x1 - errorLimit < compareRect.x1
      ) {
        removedCells.push(cell);
      } else if (
        cellRect.x < compareRect.x + errorLimit &&
        cellRect.x1 > compareRect.x1 - errorLimit
      ) {
        modifiedCells.push(cell);
      }
    });

    if (removedCells.length === tableCells.length) {
      this.tableDestroy();
      return true;
    }

    // remove the matches column tool cell
    delIndexes.forEach((delIndex) => {
      // @ts-expect-error fix-types
      this.colGroup().children.at(delIndexes[0]).remove();
    });

    removedCells.forEach((cell) => {
      cell.remove();
    });

    modifiedCells.forEach((cell) => {
      const cellColspan = parseInt(cell.formats().colspan, 10);
      const cellWidth = parseInt(cell.formats().width, 10);
      cell.format('colspan', cellColspan - delIndexes.length);
    });

    this.updateTableWidth();
  }

  deleteRow(compareRect, editorWrapper) {
    const [body] = this.descendants(TableBody);
    if (body == null || body.children.head == null) return;

    const tableCells = this.descendants(TableCell);
    const tableRows = this.descendants(TableRow);
    const removedCells = []; // cells to be removed
    const modifiedCells = []; // cells to be modified
    const fallCells = []; // cells to fall into next row

    // compute rows to remove
    // bugfix: #21 There will be a empty tr left if delete the last row of a table
    const removedRows = tableRows.filter((row) => {
      const rowRect = getRelativeRect(
        row.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      return (
        rowRect.y > compareRect.y - errorLimit &&
        rowRect.y1 < compareRect.y1 + errorLimit
      );
    });

    tableCells.forEach((cell) => {
      const cellRect = getRelativeRect(
        cell.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      if (
        cellRect.y > compareRect.y - errorLimit &&
        cellRect.y1 < compareRect.y1 + errorLimit
      ) {
        removedCells.push(cell);
      } else if (
        cellRect.y < compareRect.y + errorLimit &&
        cellRect.y1 > compareRect.y1 - errorLimit
      ) {
        modifiedCells.push(cell);

        if (Math.abs(cellRect.y - compareRect.y) < errorLimit) {
          fallCells.push(cell);
        }
      }
    });

    if (removedCells.length === tableCells.length) {
      this.tableDestroy();
      return;
    }

    // compute length of removed rows
    const removedRowsLength = this.rows().reduce((sum, row) => {
      const rowRect = getRelativeRect(
        row.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      if (
        rowRect.y > compareRect.y - errorLimit &&
        rowRect.y1 < compareRect.y1 + errorLimit
      ) {
        sum += 1;
      }
      return sum;
    }, 0);

    // it must excute before the table layout changed with other operation
    fallCells.forEach((cell) => {
      const cellRect = getRelativeRect(
        cell.domNode.getBoundingClientRect(),
        editorWrapper,
      );
      const nextRow = cell.parent.next;
      const cellsInNextRow = nextRow.children;

      const refCell = cellsInNextRow.reduce((ref, compareCell) => {
        const compareRect = getRelativeRect(
          compareCell.domNode.getBoundingClientRect(),
          editorWrapper,
        );
        if (Math.abs(cellRect.x1 - compareRect.x) < errorLimit) {
          ref = compareCell;
        }
        return ref;
      }, null);

      nextRow.insertBefore(cell, refCell);
      cell.format('row', nextRow.formats().row);
    });

    removedCells.forEach((cell) => {
      cell.remove();
    });

    modifiedCells.forEach((cell) => {
      const cellRowspan = parseInt(cell.formats().rowspan, 10);
      cell.format('rowspan', cellRowspan - removedRowsLength);
    });

    // remove selected rows
    removedRows.forEach((row) => row.remove());
  }

  tableDestroy() {
    const quill = Quill.find(this.scroll.domNode.parentNode);
    // @ts-expect-error fix-types
    const tableModule = quill.getModule('tableEditable');
    this.remove();
    tableModule.hideTableTools();
    // @ts-expect-error fix-types 🚨
    quill.update(Quill.sources.USER);
  }

  insertCell(tableRow, ref) {
    const id = genCellId();
    const rId = tableRow.formats().row;
    const tableCell = this.scroll.create(
      TableCell.blotName,
      Object.assign({}, CELL_DEFAULT, {
        row: rId,
      }),
    );
    const cellLine = this.scroll.create(TableCellLine.blotName, {
      row: rId,
      cell: id,
    });
    // @ts-expect-error fix-types
    tableCell.appendChild(cellLine);

    if (ref) {
      tableRow.insertBefore(tableCell, ref);
    } else {
      tableRow.appendChild(tableCell);
    }
  }

  insertColumn(compareRect, colIndex, isRight = true, editorWrapper) {
    const [body] = this.descendants(TableBody);
    const [tableColGroup] = this.descendants(TableColGroup);
    const tableCols = this.descendants(TableCol);
    const addAsideCells = [];
    const modifiedCells = [];
    const affectedCells = [];

    if (body == null || body.children.head == null) return;
    const tableCells = this.descendants(TableCell);
    tableCells.forEach((cell) => {
      const cellRect = getRelativeRect(
        cell.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      if (isRight) {
        if (Math.abs(cellRect.x1 - compareRect.x1) < errorLimit) {
          // the right of selected boundary equal to the right of table cell,
          // add a new table cell right aside this table cell
          addAsideCells.push(cell);
        } else if (
          compareRect.x1 - cellRect.x > errorLimit &&
          compareRect.x1 - cellRect.x1 < -errorLimit
        ) {
          // the right of selected boundary is inside this table cell
          // colspan of this table cell will increase 1
          modifiedCells.push(cell);
        }
      } else {
        if (Math.abs(cellRect.x - compareRect.x) < errorLimit) {
          // left of selected boundary equal to left of table cell,
          // add a new table cell left aside this table cell
          addAsideCells.push(cell);
        } else if (
          compareRect.x - cellRect.x > errorLimit &&
          compareRect.x - cellRect.x1 < -errorLimit
        ) {
          // the left of selected boundary is inside this table cell
          // colspan of this table cell will increase 1
          modifiedCells.push(cell);
        }
      }
    });

    addAsideCells.forEach((cell) => {
      const ref = isRight ? cell.next : cell;
      const id = genCellId();
      const tableRow = cell.parent;
      const rId = tableRow.formats().row;
      const cellFormats = cell.formats();
      const tableCell = this.scroll.create(
        TableCell.blotName,
        Object.assign({}, CELL_DEFAULT, {
          row: rId,
          rowspan: cellFormats.rowspan,
        }),
      );
      const cellLine = this.scroll.create(TableCellLine.blotName, {
        row: rId,
        cell: id,
        rowspan: cellFormats.rowspan,
      });
      // @ts-expect-error fix-types
      tableCell.appendChild(cellLine);

      if (ref) {
        tableRow.insertBefore(tableCell, ref);
      } else {
        tableRow.appendChild(tableCell);
      }
      affectedCells.push(tableCell);
    });

    // insert new tableCol
    const tableCol = this.scroll.create(TableCol.blotName, true);
    const colRef = isRight ? tableCols[colIndex].next : tableCols[colIndex];
    if (colRef) {
      tableColGroup.insertBefore(tableCol, colRef);
    } else {
      tableColGroup.appendChild(tableCol);
    }

    modifiedCells.forEach((cell) => {
      const cellColspan = cell.formats().colspan;
      cell.format('colspan', parseInt(cellColspan, 10) + 1);
      affectedCells.push(cell);
    });

    affectedCells.sort((cellA, cellB) => {
      const y1 = cellA.domNode.getBoundingClientRect().y;
      const y2 = cellB.domNode.getBoundingClientRect().y;
      return y1 - y2;
    });

    this.updateTableWidth();
    return affectedCells;
  }

  insertRow(compareRect, isDown, editorWrapper) {
    const [body] = this.descendants(TableBody);
    if (body == null || body.children.head == null) return;

    const tableCells = this.descendants(TableCell);
    const rId = genRowId();
    const newRow = this.scroll.create(TableRow.blotName, {
      row: rId,
    });
    const addBelowCells = [];
    const modifiedCells = [];
    const affectedCells = [];

    tableCells.forEach((cell) => {
      const cellRect = getRelativeRect(
        cell.domNode.getBoundingClientRect(),
        editorWrapper,
      );

      if (isDown) {
        if (Math.abs(cellRect.y1 - compareRect.y1) < errorLimit) {
          addBelowCells.push(cell);
        } else if (
          compareRect.y1 - cellRect.y > errorLimit &&
          compareRect.y1 - cellRect.y1 < -errorLimit
        ) {
          modifiedCells.push(cell);
        }
      } else {
        if (Math.abs(cellRect.y - compareRect.y) < errorLimit) {
          addBelowCells.push(cell);
        } else if (
          compareRect.y - cellRect.y > errorLimit &&
          compareRect.y - cellRect.y1 < -errorLimit
        ) {
          modifiedCells.push(cell);
        }
      }
    });

    // ordered table cells with rect.x, fix error for inserting
    // new table cell in complicated table with wrong order.
    const sortFunc = (cellA, cellB) => {
      const x1 = cellA.domNode.getBoundingClientRect().x;
      const x2 = cellB.domNode.getBoundingClientRect().x;
      return x1 - x2;
    };
    addBelowCells.sort(sortFunc);

    addBelowCells.forEach((cell) => {
      const cId = genCellId();
      const cellFormats = cell.formats();

      const tableCell = this.scroll.create(
        TableCell.blotName,
        Object.assign({}, CELL_DEFAULT, {
          row: rId,
          colspan: cellFormats.colspan,
        }),
      );
      const cellLine = this.scroll.create(TableCellLine.blotName, {
        row: rId,
        cell: cId,
        colspan: cellFormats.colspan,
      });
      const empty = this.scroll.create(Break.blotName);
      // @ts-expect-error fix-types
      cellLine.appendChild(empty);
      // @ts-expect-error fix-types
      tableCell.appendChild(cellLine);
      // @ts-expect-error fix-types
      newRow.appendChild(tableCell);
      affectedCells.push(tableCell);
    });

    modifiedCells.forEach((cell) => {
      const cellRowspan = parseInt(cell.formats().rowspan, 10);
      cell.format('rowspan', cellRowspan + 1);
      affectedCells.push(cell);
    });

    const refRow = this.rows().find((row) => {
      const rowRect = getRelativeRect(
        row.domNode.getBoundingClientRect(),
        editorWrapper,
      );
      if (isDown) {
        return (
          Math.abs(rowRect.y - compareRect.y - compareRect.height) < errorLimit
        );
      } else {
        return Math.abs(rowRect.y - compareRect.y) < errorLimit;
      }
    });
    body.insertBefore(newRow, refRow);

    // reordering affectedCells
    affectedCells.sort(sortFunc);
    return affectedCells;
  }

  mergeCells(compareRect, mergingCells, rowspan, colspan, editorWrapper) {
    const mergedCell = mergingCells.reduce((result, tableCell, index) => {
      if (index !== 0) {
        result && tableCell.moveChildren(result);
        tableCell.remove();
      } else {
        tableCell.format('colspan', colspan);
        tableCell.format('rowspan', rowspan);
        result = tableCell;
      }

      return result;
    }, null);

    const rowId = mergedCell.domNode.getAttribute('data-row');
    const cellId = mergedCell.children.head.domNode.getAttribute('data-cell');
    mergedCell.children.forEach((cellLine) => {
      cellLine.format('cell', cellId);
      cellLine.format('row', rowId);
      cellLine.format('colspan', colspan);
      cellLine.format('rowspan', rowspan);
    });

    return mergedCell;
  }

  unmergeCells(unmergingCells, editorWrapper) {
    let cellFormats = {};
    let cellRowspan = 1;
    let cellColspan = 1;

    unmergingCells.forEach((tableCell) => {
      cellFormats = tableCell.formats();
      // @ts-expect-error fix-types
      cellRowspan = cellFormats.rowspan;
      // @ts-expect-error fix-types
      cellColspan = cellFormats.colspan;

      if (cellColspan > 1) {
        const ref = tableCell.next;
        const row = tableCell.row();
        tableCell.format('colspan', 1);
        for (let i = cellColspan; i > 1; i--) {
          this.insertCell(row, ref);
        }
      }

      if (cellRowspan > 1) {
        let i = cellRowspan;
        let nextRow = tableCell.row().next;
        while (i > 1) {
          const refInNextRow = nextRow.children.reduce((result, cell) => {
            const compareRect = getRelativeRect(
              tableCell.domNode.getBoundingClientRect(),
              editorWrapper,
            );
            const cellRect = getRelativeRect(
              cell.domNode.getBoundingClientRect(),
              editorWrapper,
            );
            if (Math.abs(compareRect.x1 - cellRect.x) < errorLimit) {
              result = cell;
            }
            return result;
          }, null);

          for (let i = cellColspan; i > 0; i--) {
            this.insertCell(nextRow, refInNextRow);
          }

          i -= 1;
          nextRow = nextRow.next;
        }

        tableCell.format('rowspan', 1);
      }
    });
  }

  rows() {
    const body = this.children.tail;
    if (body == null) return [];
    // @ts-expect-error fix-types
    return body.children.map((row) => row);
  }
}
TableContainer.blotName = 'table-container';
TableContainer.className = 'quill-better-table';
TableContainer.tagName = 'TABLE';

export class TableViewWrapper extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    const quill = Quill.find(scroll.domNode.parentNode) as Quill;
    domNode.addEventListener(
      'scroll',
      (e) => {
        const tableModule = quill.getModule('tableEditable') as TableEditable;
        if (tableModule.columnTool) {
          tableModule.columnTool.containerRoot.scrollLeft = e.target.scrollLeft;
        }

        if (
          tableModule.tableSelection &&
          tableModule.tableSelection.selectedTds.length > 0
        ) {
          tableModule.tableSelection.repositionHelpLines();
        }
      },
      false,
    );
  }

  table() {
    return this.children.head;
  }
}
TableViewWrapper.blotName = 'table-view';
TableViewWrapper.className = 'quill-better-table-wrapper';
TableViewWrapper.tagName = 'DIV';

TableViewWrapper.allowedChildren = [TableContainer];
TableContainer.requiredContainer = TableViewWrapper;

TableContainer.allowedChildren = [TableBody, TableColGroup];
TableBody.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;
// https://github.com/soccerloway/quill-better-table/issues/68
// 支持table中输入List
// const List = Quill.import('formats/list');
// TableCell.allowedChildren = [TableCellLine, Header, List.requiredContainer, Block];
TableCell.allowedChildren = [TableCellLine, Header];
TableCellLine.requiredContainer = TableCell;

TableColGroup.allowedChildren = [TableCol];
TableColGroup.requiredContainer = TableContainer;

TableCol.requiredContainer = TableColGroup;

export function genRowId() {
  const id = Math.random().toString(36).slice(2, 6);
  return `row-${id}`;
}

export function genCellId() {
  const id = Math.random().toString(36).slice(2, 6);
  return `cell-${id}`;
}
