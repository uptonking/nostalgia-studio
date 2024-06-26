import arrayMapper from '../../mixins/array-mapper';
import { mixin } from '../../helpers/object';
import { rangeEach } from '../../helpers/number';

/**
 * @class RowsMapper
 */
class RowsMapper {
  /**
   * Reset current map array and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createMap(length) {
    const originLength = length === undefined ? this._arrayMap.length : length;

    this._arrayMap.length = 0;

    rangeEach(originLength - 1, (itemIndex) => {
      this._arrayMap[itemIndex] = itemIndex;
    });
  }

  /**
   * Destroy class.
   */
  destroy() {
    this._arrayMap = null;
  }
}

mixin(RowsMapper, arrayMapper);

export default RowsMapper;
