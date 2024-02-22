import { nextTick } from 'pouchdb-utils';

function getCacheFor(transaction, store) {
  const prefix = store.prefix()[0];
  const cache = transaction._cache;
  let subCache = cache.get(prefix);
  if (!subCache) {
    subCache = new Map();
    cache.set(prefix, subCache);
  }
  return subCache;
}

/** similar to an idb or websql transaction object
 * designed to be passed around. basically just caches
 * things in-memory and then does a big `batch()` operation
 * when you're done
 */
export class LevelTransaction {
  _batch: any[];
  _cache: Map<any, any>;

  constructor() {
    this._batch = [];
    this._cache = new Map();
  }

  get(store, key, callback) {
    const cache = getCacheFor(this, store);
    const exists = cache.get(key);
    if (exists) {
      return nextTick(function () {
        callback(null, exists);
      });
    } else if (exists === null) {
      // deleted marker
      /* istanbul ignore next */
      return nextTick(function () {
        callback({ name: 'NotFoundError' });
      });
    }
    store.get(key, function (err, res) {
      if (err) {
        /* istanbul ignore else */
        if (err.name === 'NotFoundError') {
          cache.set(key, null);
        }
        return callback(err);
      }
      cache.set(key, res);
      callback(null, res);
    });
  }

  batch(batch) {
    for (let i = 0, len = batch.length; i < len; i++) {
      const operation = batch[i];

      const cache = getCacheFor(this, operation.prefix);

      if (operation.type === 'put') {
        cache.set(operation.key, operation.value);
      } else {
        cache.set(operation.key, null);
      }
    }
    this._batch = this._batch.concat(batch);
  }

  execute(db, callback) {
    const keys = new Set();
    const uniqBatches = [];

    // remove duplicates; last one wins
    for (let i = this._batch.length - 1; i >= 0; i--) {
      const operation = this._batch[i];
      const lookupKey = operation.prefix.prefix()[0] + '\xff' + operation.key;
      if (keys.has(lookupKey)) {
        continue;
      }
      keys.add(lookupKey);
      uniqBatches.push(operation);
    }

    db.batch(uniqBatches, callback);
  }
}

export default LevelTransaction;
