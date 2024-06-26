/**
 * Numeric cell validator
 *
 * @private
 * @validator NumericValidator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */

import { isNumeric } from '../helpers/number';

export default function numericValidator(value, callback) {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === undefined) {
    valueToValidate = '';
  }
  if (this.allowEmpty && valueToValidate === '') {
    callback(true);
  } else if (valueToValidate === '') {
    callback(false);
  } else {
    callback(isNumeric(value));
  }
}
