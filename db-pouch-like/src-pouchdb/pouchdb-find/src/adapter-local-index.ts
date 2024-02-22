import { explain, find } from './local-find-index';
import createIndex from './local-index-create';
import deleteIndex from './local-index-delete';
import getIndexes from './local-index-get';
import { callbackify } from './utils';

const createIndexAsCallback = callbackify(createIndex);
const findAsCallback = callbackify(find);
const explainAsCallback = callbackify(explain);
const getIndexesAsCallback = callbackify(getIndexes);
const deleteIndexAsCallback = callbackify(deleteIndex);

export {
  createIndexAsCallback as createIndex,
  findAsCallback as find,
  getIndexesAsCallback as getIndexes,
  deleteIndexAsCallback as deleteIndex,
  explainAsCallback as explain,
};
