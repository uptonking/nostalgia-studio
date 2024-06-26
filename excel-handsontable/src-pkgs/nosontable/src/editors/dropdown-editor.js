import AutocompleteEditor from './autocomplete-editor';
import Hooks from '../plugin-hooks';

/**
 * @private
 * @editor DropdownEditor
 * @class DropdownEditor
 * @dependencies AutocompleteEditor
 */
class DropdownEditor extends AutocompleteEditor {
  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);
    this.cellProperties.filter = false;
    this.cellProperties.strict = true;
  }
}

Hooks.getSingleton().add('beforeValidate', function (value, row, col) {
  const cellMeta = this.getCellMeta(row, this.propToCol(col));

  if (cellMeta.editor === DropdownEditor) {
    if (cellMeta.strict === undefined) {
      cellMeta.filter = false;
      cellMeta.strict = true;
    }
  }
});

export default DropdownEditor;
