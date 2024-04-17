import type { BlockBlot } from 'parchment';
import Quill from 'quill';

import { TableCell } from '../formats/table';
import { css, getRelativeRect } from '../utils/common';

const PRIMARY_COLOR = '#6918b4';
const LINE_POSITIONS = ['left', 'right', 'top', 'bottom'];
const ERROR_LIMIT = 2;

export default class TableSelection {
  table: any;
  quill: any;
  options: any;
  boundary: {
    x: number;
    x1: number;
    y: number;
    y1: number;
    width: number;
    height: number;
  };
  selectedTds: any[];
  dragging: boolean;
  selectingHandler: (e: any) => void;
  clearSelectionHandler: () => void;

  constructor(table, quill, options) {
    if (!table) return null;
    this.table = table;
    this.quill = quill;
    this.options = options;
    this.boundary = {} as any; // params for selected square
    this.selectedTds = []; // array for selected table-cells
    this.dragging = false;
    this.selectingHandler = this.mouseDownHandler.bind(this);
    this.clearSelectionHandler = this.clearSelection.bind(this);

    this.helpLinesInitial();
    this.quill.root.addEventListener('mousedown', this.selectingHandler, false);

    this.quill.on('text-change', this.clearSelectionHandler);
  }

  helpLinesInitial() {
    const parent = this.quill.root.parentNode;
    LINE_POSITIONS.forEach((direction) => {
      this[direction] = document.createElement('div');
      this[direction].classList.add('qlbt-selection-line');
      this[direction].classList.add('qlbt-selection-line-' + direction);
      css(this[direction], {
        position: 'absolute',
        display: 'none',
        'background-color': PRIMARY_COLOR,
      });
      parent.appendChild(this[direction]);
    });
  }

  mouseDownHandler(e) {
    if (e.button !== 0 || !e.target.closest('.quill-better-table')) return;
    this.quill.root.addEventListener('mousemove', mouseMoveHandler, false);
    this.quill.root.addEventListener('mouseup', mouseUpHandler, false);

    const self = this;
    const startTd = e.target.closest('td[data-row]');
    const startTdRect = getRelativeRect(
      startTd.getBoundingClientRect(),
      this.quill.root.parentNode,
    );
    this.dragging = true;
    this.boundary = computeBoundaryFromRects(startTdRect, startTdRect);
    this.correctBoundary();
    this.selectedTds = this.computeSelectedTds();
    this.repositionHelpLines();

    function mouseMoveHandler(e) {
      if (e.button !== 0 || !e.target.closest('.quill-better-table')) return;
      const endTd = e.target.closest('td[data-row]');
      const endTdRect = getRelativeRect(
        endTd.getBoundingClientRect(),
        self.quill.root.parentNode,
      );
      self.boundary = computeBoundaryFromRects(startTdRect, endTdRect);
      self.correctBoundary();
      self.selectedTds = self.computeSelectedTds();
      self.repositionHelpLines();

      // avoid select text in multiple table-cell
      if (startTd !== endTd) {
        self.quill.blur();
      }
    }

    function mouseUpHandler(e) {
      self.quill.root.removeEventListener('mousemove', mouseMoveHandler, false);
      self.quill.root.removeEventListener('mouseup', mouseUpHandler, false);
      self.dragging = false;
    }
  }

  correctBoundary() {
    const tableContainer = Quill.find(this.table) as BlockBlot;
    const tableCells = tableContainer.descendants(TableCell);

    tableCells.forEach((tableCell) => {
      const { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        this.quill.root.parentNode,
      );
      const isCellIntersected =
        ((x + ERROR_LIMIT >= this.boundary.x &&
          x + ERROR_LIMIT <= this.boundary.x1) ||
          (x - ERROR_LIMIT + width >= this.boundary.x &&
            x - ERROR_LIMIT + width <= this.boundary.x1)) &&
        ((y + ERROR_LIMIT >= this.boundary.y &&
          y + ERROR_LIMIT <= this.boundary.y1) ||
          (y - ERROR_LIMIT + height >= this.boundary.y &&
            y - ERROR_LIMIT + height <= this.boundary.y1));
      if (isCellIntersected) {
        this.boundary = computeBoundaryFromRects(this.boundary, {
          x,
          y,
          width,
          height,
        });
      }
    });
  }

  computeSelectedTds() {
    const tableContainer = Quill.find(this.table) as BlockBlot;
    const tableCells = tableContainer.descendants(TableCell);

    return tableCells.reduce((selectedCells, tableCell) => {
      const { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        this.quill.root.parentNode,
      );
      const isCellIncluded =
        x + ERROR_LIMIT >= this.boundary['x'] &&
        x - ERROR_LIMIT + width <= this.boundary['x1'] &&
        y + ERROR_LIMIT >= this.boundary['y'] &&
        y - ERROR_LIMIT + height <= this.boundary['y1'];

      if (isCellIncluded) {
        selectedCells.push(tableCell);
      }

      return selectedCells;
    }, []);
  }

  repositionHelpLines() {
    const tableViewScrollLeft = this.table.parentNode.scrollLeft;
    css(this.left, {
      display: 'block',
      left: `${this.boundary.x - tableViewScrollLeft - 1}px`,
      top: `${this.boundary.y}px`,
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });

    css(this.right, {
      display: 'block',
      left: `${this.boundary.x1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y}px`,
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });

    css(this.top, {
      display: 'block',
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y}px`,
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });

    css(this.bottom, {
      display: 'block',
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y1 + 1}px`,
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });
  }
  left(
    left: any,
    arg1: {
      display: string;
      left: string;
      top: string;
      height: string;
      width: string;
    },
  ) {
    throw new Error('Method not implemented.');
  }
  right(
    right: any,
    arg1: {
      display: string;
      left: string;
      top: string;
      height: string;
      width: string;
    },
  ) {
    throw new Error('Method not implemented.');
  }
  top(
    top: any,
    arg1: {
      display: string;
      left: string;
      top: string;
      width: string;
      height: string;
    },
  ) {
    throw new Error('Method not implemented.');
  }
  bottom(
    bottom: any,
    arg1: {
      display: string;
      left: string;
      top: string;
      width: string;
      height: string;
    },
  ) {
    throw new Error('Method not implemented.');
  }

  // based on selectedTds compute positions of help lines
  // It is useful when selectedTds are not changed
  refreshHelpLinesPosition() {
    const startRect = getRelativeRect(
      this.selectedTds[0].domNode.getBoundingClientRect(),
      this.quill.root.parentNode,
    );
    const endRect = getRelativeRect(
      this.selectedTds[
        this.selectedTds.length - 1
      ].domNode.getBoundingClientRect(),
      this.quill.root.parentNode,
    );
    this.boundary = computeBoundaryFromRects(startRect, endRect);
    this.repositionHelpLines();
  }

  destroy() {
    LINE_POSITIONS.forEach((direction) => {
      this[direction].remove();
      this[direction] = null;
    });

    this.quill.root.removeEventListener(
      'mousedown',
      this.selectingHandler,
      false,
    );

    this.quill.off('text-change', this.clearSelectionHandler);

    return null;
  }

  setSelection(startRect, endRect) {
    this.boundary = computeBoundaryFromRects(
      getRelativeRect(startRect, this.quill.root.parentNode),
      getRelativeRect(endRect, this.quill.root.parentNode),
    );
    this.correctBoundary();
    this.selectedTds = this.computeSelectedTds();
    this.repositionHelpLines();
  }

  clearSelection() {
    this.boundary = {} as any;
    this.selectedTds = [];
    LINE_POSITIONS.forEach((direction) => {
      this[direction] &&
        css(this[direction], {
          display: 'none',
        });
    });
  }
}

function computeBoundaryFromRects(startRect, endRect) {
  const x = Math.min(
    startRect.x,
    endRect.x,
    startRect.x + startRect.width - 1,
    endRect.x + endRect.width - 1,
  );

  const x1 = Math.max(
    startRect.x,
    endRect.x,
    startRect.x + startRect.width - 1,
    endRect.x + endRect.width - 1,
  );

  const y = Math.min(
    startRect.y,
    endRect.y,
    startRect.y + startRect.height - 1,
    endRect.y + endRect.height - 1,
  );

  const y1 = Math.max(
    startRect.y,
    endRect.y,
    startRect.y + startRect.height - 1,
    endRect.y + endRect.height - 1,
  );

  const width = x1 - x;
  const height = y1 - y;

  return { x, x1, y, y1, width, height };
}
