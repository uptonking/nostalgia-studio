import { createError, IDB_ERROR } from 'pouchdb-errors';
import { collectConflicts } from 'pouchdb-merge';

import { ATTACH_STORE, BY_SEQ_STORE, DOC_STORE, META_STORE } from './constants';
import getAll from './getAll';
import runBatchedCursor from './runBatchedCursor';
import {
  decodeDoc,
  decodeMetadata,
  fetchAttachmentsIfNecessary,
  idbError,
  openTransactionSafely,
  postProcessAttachments,
} from './utils';

function allDocsKeys(
  keys: any[],
  docStore: {
    get: (arg0: any) => {
      (): any;
      new (): any;
      onsuccess: (event: any) => void;
    };
  },
  onBatch: {
    (batchKeys: any, batchValues: any, cursor: any): void;
    (arg0: any, arg1: any[], arg2: {}): void;
  },
) {
  // It's not guaranteed to be returned in right order
  const valuesBatch = new Array(keys.length);
  let count = 0;
  keys.forEach(function (key: any, index: number) {
    docStore.get(key).onsuccess = function (event: {
      target: { result: any };
    }) {
      if (event.target.result) {
        valuesBatch[index] = event.target.result;
      } else {
        valuesBatch[index] = { key, error: 'not_found' };
      }
      count++;
      if (count === keys.length) {
        onBatch(keys, valuesBatch, {});
      }
    };
  });
}

function createKeyRange(
  start: any,
  end: any,
  inclusiveEnd: boolean,
  key: any,
  descending: any,
) {
  try {
    if (start && end) {
      if (descending) {
        return IDBKeyRange.bound(end, start, !inclusiveEnd, false);
      } else {
        return IDBKeyRange.bound(start, end, false, !inclusiveEnd);
      }
    } else if (start) {
      if (descending) {
        return IDBKeyRange.upperBound(start);
      } else {
        return IDBKeyRange.lowerBound(start);
      }
    } else if (end) {
      if (descending) {
        return IDBKeyRange.lowerBound(end, !inclusiveEnd);
      } else {
        return IDBKeyRange.upperBound(end, !inclusiveEnd);
      }
    } else if (key) {
      return IDBKeyRange.only(key);
    }
  } catch (e) {
    return { error: e };
  }
  return null;
}

function idbAllDocs(
  opts: {
    startkey: any;
    endkey: any;
    key: any;
    keys: any;
    skip: number;
    limit: any;
    inclusive_end: boolean;
    descending: any;
    attachments: any;
    update_seq: any;
    conflicts: any;
    include_docs: any;
    binary: any;
  },
  idb: any,
  callback: {
    (error: any, result?: any): void;
    (arg0: unknown, arg1: { total_rows: any; offset: any; rows: any[] }): void;
  },
) {
  const start = 'startkey' in opts ? opts.startkey : false;
  const end = 'endkey' in opts ? opts.endkey : false;
  const key = 'key' in opts ? opts.key : false;
  const keys = 'keys' in opts ? opts.keys : false;
  let skip = opts.skip || 0;
  const limit = typeof opts.limit === 'number' ? opts.limit : -1;
  const inclusiveEnd = opts.inclusive_end !== false;

  let keyRange: any;
  let keyRangeError;
  if (!keys) {
    keyRange = createKeyRange(start, end, inclusiveEnd, key, opts.descending);
    keyRangeError = keyRange && keyRange.error;
    if (
      keyRangeError &&
      !(keyRangeError.name === 'DataError' && keyRangeError.code === 0)
    ) {
      // DataError with error code 0 indicates start is less than end, so
      // can just do an empty query. Else need to throw
      return callback(
        createError(IDB_ERROR, keyRangeError.name, keyRangeError.message),
      );
    }
  }

  const stores = [DOC_STORE, BY_SEQ_STORE, META_STORE];

  if (opts.attachments) {
    stores.push(ATTACH_STORE);
  }
  const txnResult = openTransactionSafely(idb, stores, 'readonly');
  if (txnResult.error) {
    return callback(txnResult.error);
  }
  const txn = txnResult.txn;
  txn.oncomplete = onTxnComplete;
  txn.onabort = idbError(callback);
  const docStore = txn.objectStore(DOC_STORE);
  const seqStore = txn.objectStore(BY_SEQ_STORE);
  const metaStore = txn.objectStore(META_STORE);
  const docIdRevIndex = seqStore.index('_doc_id_rev');
  const results: { id: any; key: any; value: { rev: any } }[] = [];
  let docCount: any;
  let updateSeq: any;

  metaStore.get(META_STORE).onsuccess = function (e: {
    target: { result: { docCount: any } };
  }) {
    docCount = e.target.result.docCount;
  };

  /* istanbul ignore if */
  if (opts.update_seq) {
    // get max updateSeq
    seqStore.openKeyCursor(null, 'prev').onsuccess = (e: {
      target: { result: any };
    }) => {
      const cursor = e.target.result;
      if (cursor && cursor.key) {
        updateSeq = cursor.key;
      }
    };
  }

  // if the user specifies include_docs=true, then we don't
  // want to block the main cursor while we're fetching the doc
  function fetchDocAsynchronously(
    metadata: { id: string },
    row: { id?: any; key?: any; value?: { rev: any }; doc?: any },
    winningRev: string,
  ) {
    const key = metadata.id + '::' + winningRev;
    docIdRevIndex.get(key).onsuccess = function onGetDoc(e: {
      target: { result: any };
    }) {
      row.doc = decodeDoc(e.target.result) || {};
      if (opts.conflicts) {
        const conflicts = collectConflicts(metadata);
        if (conflicts.length) {
          row.doc._conflicts = conflicts;
        }
      }
      fetchAttachmentsIfNecessary(row.doc, opts, txn);
    };
  }

  function allDocsInner(winningRev: any, metadata: { id: any; deleted: any }) {
    const row: any = {
      id: metadata.id,
      key: metadata.id,
      value: {
        rev: winningRev,
      },
    };
    const deleted = metadata.deleted;
    if (deleted) {
      if (keys) {
        results.push(row);
        // deleted docs are okay with "keys" requests
        row.value.deleted = true;
        row.doc = null;
      }
    } else if (skip-- <= 0) {
      results.push(row);
      if (opts.include_docs) {
        fetchDocAsynchronously(metadata, row, winningRev);
      }
    }
  }

  function processBatch(batchValues: string | any[]) {
    for (let i = 0, len = batchValues.length; i < len; i++) {
      if (results.length === limit) {
        break;
      }
      const batchValue = batchValues[i];
      if (batchValue.error && keys) {
        // key was not found with "keys" requests
        results.push(batchValue);
        continue;
      }
      const metadata = decodeMetadata(batchValue);
      const winningRev = metadata.winningRev;
      allDocsInner(winningRev, metadata);
    }
  }

  function onBatch(
    batchKeys: any,
    batchValues: any,
    cursor: { continue: () => void },
  ) {
    if (!cursor) {
      return;
    }
    processBatch(batchValues);
    if (results.length < limit) {
      cursor.continue();
    }
  }

  function onGetAll(e: { target: { result: any } }) {
    let values = e.target.result;
    if (opts.descending) {
      values = values.reverse();
    }
    processBatch(values);
  }

  function onResultsReady() {
    const returnVal: any = {
      total_rows: docCount,
      offset: opts.skip,
      rows: results,
    };

    /* istanbul ignore if */
    if (opts.update_seq && updateSeq !== undefined) {
      returnVal.update_seq = updateSeq;
    }
    callback(null, returnVal);
  }

  function onTxnComplete() {
    if (opts.attachments) {
      postProcessAttachments(results, opts.binary).then(onResultsReady);
    } else {
      onResultsReady();
    }
  }

  // don't bother doing any requests if start > end or limit === 0
  if (keyRangeError || limit === 0) {
    return;
  }
  if (keys) {
    // @ts-expect-error fix-types
    return allDocsKeys(keys, docStore, onBatch);
  }
  if (limit === -1) {
    // just fetch everything
    return getAll(docStore, keyRange, onGetAll);
  }
  // else do a cursor
  // choose a batch size based on the skip, since we'll need to skip that many
  runBatchedCursor(docStore, keyRange, opts.descending, limit + skip, onBatch);
}

export default idbAllDocs;
