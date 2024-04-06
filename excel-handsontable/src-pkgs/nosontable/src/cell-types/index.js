import staticRegister from '../utils/static-register';
import { registerEditor } from '../editors';
import { registerRenderer } from '../renderers';
import { registerValidator } from '../validators';

import autocompleteCellType from './autocomplete-type';
import checkboxCellType from './checkbox-type';
import dateCellType from './date-type';
import dropdownCellType from './dropdown-type';
import handsontableCellType from './handsontable-type';
import numericCellType from './numeric-type';
import passwordCellType from './password-type';
import textCellType from './text-type';
import timeCellType from './time-type';

const { register, getItem, hasItem, getNames, getValues } =
  staticRegister('cellTypes');

_register('autocomplete', autocompleteCellType);
_register('checkbox', checkboxCellType);
_register('date', dateCellType);
_register('dropdown', dropdownCellType);
_register('handsontable', handsontableCellType);
_register('numeric', numericCellType);
_register('password', passwordCellType);
_register('text', textCellType);
_register('time', timeCellType);

/**
 * Retrieve cell type object.
 *
 * @param {String} name Cell type identification.
 * @returns {Object} Returns cell type object.
 */
function _getItem(name) {
  if (!hasItem(name)) {
    throw Error(`You declared cell type "${name}" as a string that is not mapped to a known object.
                 Cell type must be an object or a string mapped to an object registered by "Handsontable.cellTypes.registerCellType" method`);
  }

  return getItem(name);
}

/**
 * Register cell type under specified name.
 *
 * @param {String} name Cell type identification.
 * @param {Object} type An object with contains keys (eq: `editor`, `renderer`, `validator`) which describes specified behaviour of the cell.
 */
function _register(name, type) {
  const { editor, renderer, validator } = type;

  if (editor) {
    registerEditor(name, editor);
  }
  if (renderer) {
    registerRenderer(name, renderer);
  }
  if (validator) {
    registerValidator(name, validator);
  }

  register(name, type);
}

export {
  _register as registerCellType,
  _getItem as getCellType,
  hasItem as hasCellType,
  getNames as getRegisteredCellTypeNames,
  getValues as getRegisteredCellTypes,
};
