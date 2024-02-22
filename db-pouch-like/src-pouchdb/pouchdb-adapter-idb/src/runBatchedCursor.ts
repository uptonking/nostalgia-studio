// Abstraction over IDBCursor and getAll()/getAllKeys() that allows us to batch our operations
// while falling back to a normal IDBCursor operation on browsers that don't support getAll() or
// getAllKeys(). This allows for a much faster implementation than just straight-up cursors, because
// we're not processing each document one-at-a-time.
function runBatchedCursor(
  objectStore: {
    getAll: (
      arg0: any,
      arg1: any,
    ) => {
      (): any;
      new (): any;
      onsuccess: { (e: any): void; (e: any): void };
    };
    getAllKeys: (
      arg0: any,
      arg1: any,
    ) => {
      (): any;
      new (): any;
      onsuccess: { (e: any): void; (e: any): void };
    };
    openCursor: (
      arg0: any,
      arg1: string,
    ) => { (): any; new (): any; onsuccess: { (e: any): any; (e: any): any } };
  },
  keyRange: IDBKeyRange,
  descending: any,
  batchSize: number,
  onBatch: {
    (
      batchKeys?: any,
      batchValues?: any,
      cursor?: { continue: () => void },
    ): void;
    (
      batchKeys: string | any[],
      batchValues: any[],
      cursor: { continue: () => void },
    ): void;
    (arg0: any[], arg1: any[], arg2: undefined): void;
  },
) {
  if (batchSize === -1) {
    batchSize = 1000;
  }

  // Bail out of getAll()/getAllKeys() in the following cases:
  // 1) either method is unsupported - we need both
  // 2) batchSize is 1 (might as well use IDBCursor)
  // 3) descending – no real way to do this via getAll()/getAllKeys()

  const useGetAll =
    typeof objectStore.getAll === 'function' &&
    typeof objectStore.getAllKeys === 'function' &&
    batchSize > 1 &&
    !descending;

  let keysBatch: string | any[];
  let valuesBatch: null;
  let pseudoCursor: { continue: () => any };

  function onGetAll(e: { target: { result: any } }) {
    valuesBatch = e.target.result;
    if (keysBatch) {
      onBatch(keysBatch, valuesBatch, pseudoCursor);
    }
  }

  function onGetAllKeys(e: { target: { result: any } }) {
    keysBatch = e.target.result;
    if (valuesBatch) {
      onBatch(keysBatch, valuesBatch, pseudoCursor);
    }
  }

  function continuePseudoCursor() {
    if (!keysBatch.length) {
      // no more results
      return onBatch();
    }
    // fetch next batch, exclusive start
    const lastKey = keysBatch[keysBatch.length - 1];
    let newKeyRange;
    if (keyRange && keyRange.upper) {
      try {
        newKeyRange = IDBKeyRange.bound(
          lastKey,
          keyRange.upper,
          true,
          keyRange.upperOpen,
        );
      } catch (e) {
        // @ts-expect-error fix-types
        if (e.name === 'DataError' && e.code === 0) {
          return onBatch(); // we're done, startkey and endkey are equal
        }
      }
    } else {
      newKeyRange = IDBKeyRange.lowerBound(lastKey, true);
    }
    keyRange = newKeyRange;
    keysBatch = null;
    valuesBatch = null;
    objectStore.getAll(keyRange, batchSize).onsuccess = onGetAll;
    objectStore.getAllKeys(keyRange, batchSize).onsuccess = onGetAllKeys;
  }

  function onCursor(e: { target: { result: any } }) {
    const cursor = e.target.result;
    if (!cursor) {
      // done
      return onBatch();
    }
    // regular IDBCursor acts like a batch where batch size is always 1
    onBatch([cursor.key], [cursor.value], cursor);
  }

  if (useGetAll) {
    pseudoCursor = { continue: continuePseudoCursor };
    objectStore.getAll(keyRange, batchSize).onsuccess = onGetAll;
    objectStore.getAllKeys(keyRange, batchSize).onsuccess = onGetAllKeys;
  } else if (descending) {
    objectStore.openCursor(keyRange, 'prev').onsuccess = onCursor;
  } else {
    // @ts-expect-error fix-types
    objectStore.openCursor(keyRange).onsuccess = onCursor;
  }
}

export default runBatchedCursor;
