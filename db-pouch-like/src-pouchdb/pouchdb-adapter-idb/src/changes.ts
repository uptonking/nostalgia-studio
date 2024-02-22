import { clone, filterChange, uuid } from 'pouchdb-utils';

import changesHandler from './changesHandler';
import { ATTACH_STORE, BY_SEQ_STORE, DOC_STORE } from './constants';
import runBatchedCursor from './runBatchedCursor';
import {
  decodeDoc,
  decodeMetadata,
  fetchAttachmentsIfNecessary,
  idbError,
  openTransactionSafely,
  postProcessAttachments,
} from './utils';

function changes(
  opts: {
    continuous?: any;
    doc_ids?: any;
    since?: any;
    limit: any;
    processChange?: any;
    return_docs?: any;
    attachments: any;
    include_docs: any;
    binary: any;
    onChange?: any;
    complete?: any;
    descending: any;
    startkey?: any;
    endkey?: any;
    key?: any;
    keys?: any;
    skip?: number;
    inclusive_end?: boolean;
    update_seq?: any;
    conflicts?: any;
  },
  api: any,
  dbName: string,
  idb: { transaction: (arg0: any, arg1: any) => any },
) {
  opts = clone(opts);

  if (opts.continuous) {
    const id = dbName + ':' + uuid();
    changesHandler.addListener(dbName, id, api, opts);
    changesHandler.notify(dbName);
    return {
      cancel: function () {
        changesHandler.removeListener(dbName, id);
      },
    };
  }

  const docIds = opts.doc_ids && new Set(opts.doc_ids);

  opts.since = opts.since || 0;
  let lastSeq = opts.since;

  let limit = 'limit' in opts ? opts.limit : -1;
  if (limit === 0) {
    limit = 1; // per CouchDB _changes spec
  }

  const results: any[] = [];
  let numResults = 0;
  const filter = filterChange(opts);
  const docIdsToMetadata = new Map();

  let txn: { onabort?: any; oncomplete?: any; objectStore: any };
  let bySeqStore;
  let docStore: {
    get: (arg0: any) => { (): any; new (): any; onsuccess: (e: any) => void };
  };
  let docIdRevIndex: { get: (arg0: string) => any };

  function onBatch(
    batchKeys: string | any[],
    batchValues: any[],
    cursor: { continue: () => void },
  ) {
    if (!cursor || !batchKeys.length) {
      // done
      return;
    }

    const winningDocs = new Array(batchKeys.length);
    const metadatas = new Array(batchKeys.length);

    function processMetadataAndWinningDoc(
      metadata: { seq: any },
      winningDoc: { _attachments: { [x: string]: { stub: boolean } } },
    ) {
      const change = opts.processChange(winningDoc, metadata, opts);
      lastSeq = change.seq = metadata.seq;

      const filtered = filter(change);
      if (typeof filtered === 'object') {
        // anything but true/false indicates error
        return Promise.reject(filtered);
      }

      if (!filtered) {
        return Promise.resolve();
      }
      numResults++;
      if (opts.return_docs) {
        results.push(change);
      }
      // process the attachment immediately
      // for the benefit of live listeners
      if (opts.attachments && opts.include_docs) {
        return new Promise(function (resolve) {
          fetchAttachmentsIfNecessary(winningDoc, opts, txn, function () {
            postProcessAttachments([change], opts.binary).then(function () {
              resolve(change);
            });
          });
        });
      } else {
        return Promise.resolve(change);
      }
    }

    function onBatchDone() {
      const promises = [];
      for (let i = 0, len = winningDocs.length; i < len; i++) {
        if (numResults === limit) {
          break;
        }
        const winningDoc = winningDocs[i];
        if (!winningDoc) {
          continue;
        }
        const metadata = metadatas[i];
        promises.push(processMetadataAndWinningDoc(metadata, winningDoc));
      }

      Promise.all(promises)
        .then(function (changes) {
          for (let i = 0, len = changes.length; i < len; i++) {
            if (changes[i]) {
              opts.onChange(changes[i]);
            }
          }
        })
        .catch(opts.complete);

      if (numResults !== limit) {
        cursor.continue();
      }
    }

    // Fetch all metadatas/winningdocs from this batch in parallel, then process
    // them all only once all data has been collected. This is done in parallel
    // because it's faster than doing it one-at-a-time.
    let numDone = 0;
    batchValues.forEach(function (
      value: { _doc_id_rev: string; _id: any; _rev: any },
      i: number,
    ) {
      const doc = decodeDoc(value);
      const seq = batchKeys[i];
      fetchWinningDocAndMetadata(
        doc,
        seq,
        // @ts-expect-error fix-types
        function (metadata: any, winningDoc: any) {
          metadatas[i] = metadata;
          winningDocs[i] = winningDoc;
          if (++numDone === batchKeys.length) {
            onBatchDone();
          }
        },
      );
    });
  }

  function onGetMetadata(
    doc: { _rev: any; _id: string },
    seq: any,
    metadata: { seq: any; winningRev: string },
    cb: (
      arg0?: undefined,
      arg1?: { _doc_id_rev: string; _id: any; _rev: any },
    ) => void,
  ) {
    if (metadata.seq !== seq) {
      // some other seq is later
      return cb();
    }

    if (metadata.winningRev === doc._rev) {
      // this is the winning doc
      // @ts-expect-error fix-types
      return cb(metadata, doc);
    }

    // fetch winning doc in separate request
    const docIdRev = doc._id + '::' + metadata.winningRev;
    const req = docIdRevIndex.get(docIdRev);
    req.onsuccess = function (e: {
      target: { result: { _doc_id_rev: string; _id: any; _rev: any } };
    }) {
      // @ts-expect-error fix-types
      cb(metadata, decodeDoc(e.target.result));
    };
  }

  function fetchWinningDocAndMetadata(
    doc: { _doc_id_rev?: string; _id: any; _rev?: any },
    seq: any,
    cb: { (metadata: any, winningDoc: any): void; (): any },
  ) {
    if (docIds && !docIds.has(doc._id)) {
      return cb();
    }

    let metadata = docIdsToMetadata.get(doc._id);
    if (metadata) {
      // cached
      // @ts-expect-error fix-types
      return onGetMetadata(doc, seq, metadata, cb);
    }
    // metadata not cached, have to go fetch it
    docStore.get(doc._id).onsuccess = function (e: {
      target: {
        result: {
          data: any;
          winningRev: any;
          deletedOrLocal: string;
          seq: any;
        };
      };
    }) {
      metadata = decodeMetadata(e.target.result);
      docIdsToMetadata.set(doc._id, metadata);
      // @ts-expect-error fix-types
      onGetMetadata(doc, seq, metadata, cb);
    };
  }

  function finish() {
    opts.complete(null, {
      results,
      last_seq: lastSeq,
    });
  }

  function onTxnComplete() {
    if (!opts.continuous && opts.attachments) {
      // cannot guarantee that postProcessing was already done, so do it again
      // @ts-expect-error fix-types
      postProcessAttachments(results).then(finish);
    } else {
      finish();
    }
  }

  const objectStores = [DOC_STORE, BY_SEQ_STORE];
  if (opts.attachments) {
    objectStores.push(ATTACH_STORE);
  }
  const txnResult = openTransactionSafely(idb, objectStores, 'readonly');
  if (txnResult.error) {
    return opts.complete(txnResult.error);
  }
  txn = txnResult.txn;
  txn.onabort = idbError(opts.complete);
  txn.oncomplete = onTxnComplete;

  bySeqStore = txn.objectStore(BY_SEQ_STORE);
  docStore = txn.objectStore(DOC_STORE);
  docIdRevIndex = bySeqStore.index('_doc_id_rev');

  const keyRange =
    opts.since && !opts.descending
      ? IDBKeyRange.lowerBound(opts.since, true)
      : null;

  runBatchedCursor(bySeqStore, keyRange, opts.descending, limit, onBatch);
}

export default changes;
