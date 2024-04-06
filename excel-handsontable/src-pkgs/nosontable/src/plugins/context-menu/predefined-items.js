import { objectEach } from '../../helpers/object';
import alignmentItem, { KEY as ALIGNMENT } from './predefined-items/alignment';
import clearColumnItem, {
  KEY as CLEAR_COLUMN,
} from './predefined-items/clear-column';
import columnLeftItem, {
  KEY as COLUMN_LEFT,
} from './predefined-items/column-left';
import columnRightItem, {
  KEY as COLUMN_RIGHT,
} from './predefined-items/column-right';
import readOnlyItem, { KEY as READ_ONLY } from './predefined-items/read-only';
import redoItem, { KEY as REDO } from './predefined-items/redo';
import removeColumnItem, {
  KEY as REMOVE_COLUMN,
} from './predefined-items/remove-column';
import removeRowItem, {
  KEY as REMOVE_ROW,
} from './predefined-items/remove-row';
import rowAboveItem, { KEY as ROW_ABOVE } from './predefined-items/row-above';
import rowBelowItem, { KEY as ROW_BELOW } from './predefined-items/row-below';
import separatorItem, { KEY as SEPARATOR } from './predefined-items/separator';
import undoItem, { KEY as UNDO } from './predefined-items/undo';

export { KEY as ALIGNMENT } from './predefined-items/alignment';
export { KEY as CLEAR_COLUMN } from './predefined-items/clear-column';
export { KEY as COLUMN_LEFT } from './predefined-items/column-left';
export { KEY as COLUMN_RIGHT } from './predefined-items/column-right';
export { KEY as READ_ONLY } from './predefined-items/read-only';
export { KEY as REDO } from './predefined-items/redo';
export { KEY as REMOVE_COLUMN } from './predefined-items/remove-column';
export { KEY as REMOVE_ROW } from './predefined-items/remove-row';
export { KEY as ROW_ABOVE } from './predefined-items/row-above';
export { KEY as ROW_BELOW } from './predefined-items/row-below';
export { KEY as SEPARATOR } from './predefined-items/separator';
export { KEY as UNDO } from './predefined-items/undo';

export const ITEMS = [
  ROW_ABOVE,
  ROW_BELOW,
  COLUMN_LEFT,
  COLUMN_RIGHT,
  CLEAR_COLUMN,
  REMOVE_ROW,
  REMOVE_COLUMN,
  UNDO,
  REDO,
  READ_ONLY,
  ALIGNMENT,
  SEPARATOR,
];

const _predefinedItems = {
  [SEPARATOR]: separatorItem,
  [ROW_ABOVE]: rowAboveItem,
  [ROW_BELOW]: rowBelowItem,
  [COLUMN_LEFT]: columnLeftItem,
  [COLUMN_RIGHT]: columnRightItem,
  [CLEAR_COLUMN]: clearColumnItem,
  [REMOVE_ROW]: removeRowItem,
  [REMOVE_COLUMN]: removeColumnItem,
  [UNDO]: undoItem,
  [REDO]: redoItem,
  [READ_ONLY]: readOnlyItem,
  [ALIGNMENT]: alignmentItem,
};

/**
 * Gets new object with all predefined menu items.
 *
 * @returns {Object}
 */
export function predefinedItems() {
  const items = {};

  objectEach(_predefinedItems, (itemFactory, key) => {
    items[key] = itemFactory();
  });

  return items;
}

/**
 * Add new predefined menu item to the collection.
 *
 * @param {String} key Menu command id.
 * @param {Object} item Object command descriptor.
 */
export function addItem(key, item) {
  if (ITEMS.indexOf(key) === -1) {
    _predefinedItems[key] = item;
  }
}
