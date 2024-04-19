import type { BlockBlot } from 'parchment';
import Quill from 'quill';

import type { RectBoundary } from '../../types';
import { tableDefaultOptions } from './config';
import { TableCell } from './formats-table';
import { css, getRelativeRect } from './utils/common';

const selLineDirections = ['left', 'right', 'top', 'bottom'] as const;
const errorLimit = 2;

/** custom table selection */
export class TableSelection {
  tableRoot: HTMLElement;
  selLines: {
    left: HTMLElement;
    right: HTMLElement;
    top: HTMLElement;
    bottom: HTMLElement;
  };
  /** array for selected table-cells */
  selectedTds: any[];
  quill: Quill;
  options: any;
  /** params for selected square */
  boundary: RectBoundary;
  dragging: boolean;

  constructor(table, quill, options) {
    if (!table) return null;
    this.tableRoot = table;
    this.selLines = {} as any;
    this.quill = quill;
    this.options = options;
    this.boundary = {} as any;
    this.selectedTds = [];
    this.dragging = false;
    this.mouseDownHandler = this.mouseDownHandler.bind(this);
    this.clearSelection = this.clearSelection.bind(this);

    this.helpLinesInit();
    this.quill.root.addEventListener('mousedown', this.mouseDownHandler, false);

    this.quill.on('text-change', this.clearSelection);
  }

  helpLinesInit() {
    const parent = this.quill.root.parentNode;
    selLineDirections.forEach((direction) => {
      this.selLines[direction] = document.createElement('div');
      this.selLines[direction].classList.add('qlbt-selection-line');
      this.selLines[direction].classList.add(
        'qlbt-selection-line-' + direction,
      );
      css(this.selLines[direction], {
        position: 'absolute',
        display: 'none',
        'background-color': tableDefaultOptions.primaryColor,
      });
      parent.appendChild(this.selLines[direction]);
    });
    // console.log(';; initSel ', LINE_POSITIONS, this);
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
    const tableContainer = Quill.find(this.tableRoot) as BlockBlot;
    const tableCells = tableContainer.descendants(TableCell);

    tableCells.forEach((tableCell) => {
      const { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        this.quill.root.parentNode,
      );
      const isCellIntersected =
        ((x + errorLimit >= this.boundary.x &&
          x + errorLimit <= this.boundary.x1) ||
          (x - errorLimit + width >= this.boundary.x &&
            x - errorLimit + width <= this.boundary.x1)) &&
        ((y + errorLimit >= this.boundary.y &&
          y + errorLimit <= this.boundary.y1) ||
          (y - errorLimit + height >= this.boundary.y &&
            y - errorLimit + height <= this.boundary.y1));
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
    const tableContainer = Quill.find(this.tableRoot) as BlockBlot;
    const tableCells = tableContainer.descendants(TableCell);

    return tableCells.reduce((selectedCells, tableCell) => {
      const { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        this.quill.root.parentNode,
      );
      const isCellIncluded =
        x + errorLimit >= this.boundary['x'] &&
        x - errorLimit + width <= this.boundary['x1'] &&
        y + errorLimit >= this.boundary['y'] &&
        y - errorLimit + height <= this.boundary['y1'];

      if (isCellIncluded) {
        selectedCells.push(tableCell);
      }

      return selectedCells;
    }, []);
  }

  repositionHelpLines() {
    const tableViewScrollLeft = this.tableRoot.parentNode['scrollLeft'];
    css(this.selLines.left, {
      display: 'block',
      left: `${this.boundary.x - tableViewScrollLeft - 1}px`,
      top: `${this.boundary.y}px`,
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });

    css(this.selLines.right, {
      display: 'block',
      left: `${this.boundary.x1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y}px`,
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });

    css(this.selLines.top, {
      display: 'block',
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y}px`,
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });

    css(this.selLines.bottom, {
      display: 'block',
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      top: `${this.boundary.y1 + 1}px`,
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });
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
    selLineDirections.forEach((direction) => {
      this.selLines[direction].remove();
      this.selLines[direction] = null;
    });
    this.selLines = {} as any;

    this.quill.root.removeEventListener(
      'mousedown',
      this.mouseDownHandler,
      false,
    );

    this.quill.off('text-change', this.clearSelection);

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
    selLineDirections.forEach((direction) => {
      if (this.selLines[direction]) {
        css(this.selLines[direction], {
          display: 'none',
        });
      }
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
