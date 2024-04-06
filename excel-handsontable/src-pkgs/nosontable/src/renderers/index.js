import staticRegister from '../utils/static-register';

import baseRenderer from './cell-decorator';
import autocompleteRenderer from './autocomplete-renderer';
import checkboxRenderer from './checkbox-renderer';
import htmlRenderer from './html-renderer';
import numericRenderer from './numeric-renderer';
import passwordRenderer from './password-renderer';
import textRenderer from './text-renderer';

const { register, getItem, hasItem, getNames, getValues } =
  staticRegister('renderers');

register('base', baseRenderer);
register('autocomplete', autocompleteRenderer);
register('checkbox', checkboxRenderer);
register('html', htmlRenderer);
register('numeric', numericRenderer);
register('password', passwordRenderer);
register('text', textRenderer);

/**
 * Retrieve renderer function.
 *
 * @param {String} name Renderer identification.
 * @returns {Function} Returns renderer function.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throw Error(`No registered renderer found under "${name}" name`);
  }

  return getItem(name);
}

export {
  register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers,
};
