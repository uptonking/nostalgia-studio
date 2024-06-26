import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  innerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../helpers/dom/element';
import { arrayEach } from '../helpers/array';
import Overlay from './base';

/**
 * @class TopOverlay
 */
class TopOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_TOP);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!(
      this.wot.getSetting('fixedRowsTop') ||
      this.wot.getSetting('columnHeaders').length
    );
  }

  /**
   * Updates the top overlay position.
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    let headerPosition = 0;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (
      this.trimmingContainer === window &&
      (!preventOverflow || preventOverflow !== 'vertical')
    ) {
      const box = this.wot.wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(box.top);
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalTop;

      finalLeft = this.wot.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (top < 0 && bottom - overlayRoot.offsetHeight > 0) {
        finalTop = -top;
      } else {
        finalTop = 0;
      }
      headerPosition = finalTop;
      finalTop += 'px';

      setOverlayPosition(overlayRoot, finalLeft, finalTop);
    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    this.adjustHeaderBordersPosition(headerPosition);
    this.adjustElementsSize();
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {Number} pos
   * @returns {Boolean}
   */
  setScrollPosition(pos) {
    let result = false;

    if (this.mainTableScrollableElement === window && window.scrollY !== pos) {
      window.scrollTo(getWindowScrollLeft(), pos);
      result = true;
    } else if (this.mainTableScrollableElement.scrollTop !== pos) {
      this.mainTableScrollableElement.scrollTop = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback.
   */
  onScroll() {
    this.wot.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height.
   *
   * @param {Number} from Row index which calculates started from.
   * @param {Number} to Row index where calculation is finished.
   * @returns {Number} Height sum.
   */
  sumCellSizes(from, to) {
    const defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = this.wot.wtTable.getRowHeight(row);

      sum += height === undefined ? defaultRowHeight : height;
      row += 1;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   *
   * @param {Boolean} [force=false]
   */
  adjustElementsSize(force = false) {
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();

      if (!force) {
        this.areElementSizesAdjusted = true;
      }
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    const masterHolder = this.wot.wtTable.holder;
    const scrollbarWidth =
      masterHolder.clientWidth === masterHolder.offsetWidth
        ? 0
        : getScrollbarWidth();
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer !== window || preventOverflow === 'horizontal') {
      let width = this.wot.wtViewport.getWorkspaceWidth() - scrollbarWidth;

      width = Math.min(width, innerWidth(this.wot.wtTable.wtRootElement));

      overlayRootStyle.width = `${width}px`;
    } else {
      overlayRootStyle.width = '';
    }

    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    const tableHeight = outerHeight(this.clone.wtTable.TABLE);
    overlayRootStyle.height = `${tableHeight === 0 ? tableHeight : tableHeight + 4}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    let scrollbarWidth = getScrollbarWidth();

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    this.clone.wtTable.holder.style.width =
      this.clone.wtTable.holder.parentNode.style.width;

    if (scrollbarWidth === 0) {
      scrollbarWidth = 30;
    }
    this.clone.wtTable.holder.style.height = `${parseInt(this.clone.wtTable.holder.parentNode.style.height, 10) + scrollbarWidth}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wot.getSetting('totalRows');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (
      typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number'
    ) {
      this.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;
    } else if (total === 0) {
      // can happen if there are 0 rows
      this.spreader.style.top = '0';
    } else {
      throw new Error('Incorrect value of the rowsRenderCalculator');
    }
    this.spreader.style.bottom = '';

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize calculated left position to an element.
   */
  syncOverlayOffset() {
    if (
      typeof this.wot.wtViewport.columnsRenderCalculator.startPosition ===
      'number'
    ) {
      this.clone.wtTable.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;
    } else {
      this.clone.wtTable.spreader.style.left = '';
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {Number} sourceRow Row index which you want to scroll to.
   * @param {Boolean} [bottomEdge] if `true`, scrolls according to the bottom edge (top edge is by default).
   * @returns {Boolean}
   */
  scrollTo(sourceRow, bottomEdge) {
    let newY = this.getTableParentOffset();
    const sourceInstance = this.wot.cloneSource
      ? this.wot.cloneSource
      : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth();
    }

    if (bottomEdge) {
      const fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
      const totalRows = this.wot.getSetting('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -=
        this.wot.wtViewport.getViewportHeight() -
        this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
      // Fix 1 pixel offset when cell is selected
      newY += 1;
    } else {
      newY += this.sumCellSizes(this.wot.getSetting('fixedRowsTop'), sourceRow);
    }
    newY += scrollbarCompensation;

    return this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {Number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === window) {
      return this.wot.wtTable.holderOffset.top;
    }
    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {Number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement);
  }

  /**
   * Redraw borders of selection.
   *
   * @param {WalkontableSelection} selection Selection for redraw.
   */
  redrawSelectionBorders(selection) {
    if (selection && selection.cellRange) {
      const border = selection.getBorder(this.wot);
      const corners = selection.getCorners();

      border.disappear();
      border.appear(corners);
    }
  }

  /**
   * Redrawing borders of all selections.
   */
  redrawAllSelectionsBorders() {
    const selections = this.wot.selections;

    this.redrawSelectionBorders(selections.getCell());

    arrayEach(selections.getAreas(), (area) => {
      this.redrawSelectionBorders(area);
    });
    this.redrawSelectionBorders(selections.getFill());

    this.wot.wtTable.wot.wtOverlays.leftOverlay.refresh();
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not.
   */
  adjustHeaderBordersPosition(position) {
    const masterParent = this.wot.wtTable.holder.parentNode;
    const totalColumns = this.wot.getSetting('totalColumns');

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    if (
      this.wot.getSetting('fixedRowsTop') === 0 &&
      this.wot.getSetting('columnHeaders').length > 0
    ) {
      const previousState = hasClass(masterParent, 'innerBorderTop');

      if (position || this.wot.getSetting('totalRows') === 0) {
        addClass(masterParent, 'innerBorderTop');
      } else {
        removeClass(masterParent, 'innerBorderTop');
      }

      if ((!previousState && position) || (previousState && !position)) {
        this.wot.wtOverlays.adjustElementsSize();

        // cell borders should be positioned once again,
        // because we added / removed 1px border from table header
        this.redrawAllSelectionsBorders();
      }
    }

    // nasty workaround for double border in the header, TODO: find a pure-css solution
    if (this.wot.getSetting('rowHeaders').length === 0) {
      const secondHeaderCell =
        this.clone.wtTable.THEAD.querySelectorAll('th:nth-of-type(2)');

      if (secondHeaderCell) {
        for (let i = 0; i < secondHeaderCell.length; i++) {
          secondHeaderCell[i].style['border-left-width'] = 0;
        }
      }
    }
  }
}

Overlay.registerOverlay(Overlay.CLONE_TOP, TopOverlay);

export default TopOverlay;
