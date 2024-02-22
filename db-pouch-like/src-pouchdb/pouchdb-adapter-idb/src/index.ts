import { checkBlobSupport } from 'pouchdb-adapter-utils';
import {
  createError,
  IDB_ERROR,
  MISSING_DOC,
  REV_CONFLICT,
} from 'pouchdb-errors';
import {
  isDeleted,
  isLocalId,
  latest as getLatest,
  traverseRevTree,
  winningRev as calculateWinningRev,
} from 'pouchdb-merge';
import {
  guardedConsole,
  hasLocalStorage,
  nextTick,
  toPromise,
  uuid,
} from 'pouchdb-utils';

import idbAllDocs from './allDocs';
import idbBulkDocs from './bulkDocs';
import changes from './changes';
import changesHandler from './changesHandler';
import {
  ADAPTER_VERSION,
  ATTACH_AND_SEQ_STORE,
  ATTACH_STORE,
  BY_SEQ_STORE,
  DETECT_BLOB_SUPPORT_STORE,
  DOC_STORE,
  LOCAL_STORE,
  META_STORE,
} from './constants';
import countDocs from './countDocs';
import { enqueueTask } from './taskQueue';
import {
  compactRevs,
  decodeDoc,
  decodeMetadata,
  encodeMetadata,
  idbError,
  openTransactionSafely,
  readBlobData,
} from './utils';

const cachedDBs = new Map();
let blobSupportPromise: Promise<any>;
const openReqList = new Map();

function IdbPouch(opts: any, callback: any) {
  // @ts-expect-error fix-types
  const api = this;

  enqueueTask(
    function (thisCallback: any) {
      init(api, opts, thisCallback);
    },
    callback,
    api.constructor,
  );
}

function init(
  api: {
    _meta: any;
    _remote?: any;
    type?: any;
    _id?: any;
    _bulkDocs?: any;
    _get?: any;
    _getAttachment?: any;
    _info?: any;
    _allDocs?: any;
    _changes?: any;
    _close?: any;
    _getRevisionTree?: any;
    _doCompaction?: any;
    _getLocal?: any;
    _putLocal?: any;
    _removeLocal?: any;
    _destroy?: any;
    auto_compaction?: any;
  },
  opts: { name?: any; revs_limit?: any },
  callback: (arg0: any, arg1?: undefined) => void,
) {
  const dbName = opts.name;

  let idb: {
    close?: any;
    onversionchange?: any;
    onabort?: any;
    transaction: any;
  } = null;
  let idbGlobalFailureError: null = null;
  api._meta = null;

  function enrichCallbackError(callback: (arg0: any, arg1: any) => void) {
    return function (error: { reason: any }, result: any) {
      if (error && error instanceof Error && !error.reason) {
        if (idbGlobalFailureError) {
          error.reason = idbGlobalFailureError;
        }
      }

      callback(error, result);
    };
  }

  // called when creating a fresh new database
  function createSchema(db: IDBDatabase) {
    const docStore = db.createObjectStore(DOC_STORE, { keyPath: 'id' });
    db.createObjectStore(BY_SEQ_STORE, { autoIncrement: true }).createIndex(
      '_doc_id_rev',
      '_doc_id_rev',
      { unique: true },
    );
    db.createObjectStore(ATTACH_STORE, { keyPath: 'digest' });
    db.createObjectStore(META_STORE, { keyPath: 'id', autoIncrement: false });
    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);

    // added in v2
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', { unique: false });

    // added in v3
    db.createObjectStore(LOCAL_STORE, { keyPath: '_id' });

    // added in v4
    const attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE, {
      autoIncrement: true,
    });
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', { unique: true });
  }

  // migration to version 2
  // unfortunately "deletedOrLocal" is a misnomer now that we no longer
  // store local docs in the main doc-store, but whaddyagonnado
  function addDeletedOrLocalIndex(
    txn: { objectStore: (arg0: string) => any },
    callback: () => void,
  ) {
    const docStore = txn.objectStore(DOC_STORE);
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', { unique: false });

    docStore.openCursor().onsuccess = function (event: {
      target: { result: any };
    }) {
      const cursor = event.target.result;
      if (cursor) {
        const metadata = cursor.value;
        const deleted = isDeleted(metadata);
        metadata.deletedOrLocal = deleted ? '1' : '0';
        docStore.put(metadata);
        cursor.continue();
      } else {
        callback();
      }
    };
  }

  // migration to version 3 (part 1)
  function createLocalStoreSchema(db: {
    createObjectStore: (
      arg0: string,
      arg1: { keyPath: string },
    ) => {
      (): any;
      new (): any;
      createIndex: {
        (arg0: string, arg1: string, arg2: { unique: boolean }): void;
        new (): any;
      };
    };
  }) {
    db.createObjectStore(LOCAL_STORE, { keyPath: '_id' }).createIndex(
      '_doc_id_rev',
      '_doc_id_rev',
      { unique: true },
    );
  }

  // migration to version 3 (part 2)
  function migrateLocalStore(
    txn: { objectStore: (arg0: string) => any },
    cb: () => void,
  ) {
    const localStore = txn.objectStore(LOCAL_STORE);
    const docStore = txn.objectStore(DOC_STORE);
    const seqStore = txn.objectStore(BY_SEQ_STORE);

    const cursor = docStore.openCursor();
    cursor.onsuccess = function (event: { target: { result: any } }) {
      const cursor = event.target.result;
      if (cursor) {
        const metadata = cursor.value;
        const docId = metadata.id;
        const local = isLocalId(docId);
        const rev = calculateWinningRev(metadata);
        if (local) {
          const docIdRev = docId + '::' + rev;
          // remove all seq entries
          // associated with this docId
          const start = docId + '::';
          const end = docId + '::~';
          const index = seqStore.index('_doc_id_rev');
          const range = IDBKeyRange.bound(start, end, false, false);
          let seqCursor = index.openCursor(range);
          seqCursor.onsuccess = function (e: { target: { result: any } }) {
            seqCursor = e.target.result;
            if (!seqCursor) {
              // done
              docStore.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              const data = seqCursor.value;
              if (data._doc_id_rev === docIdRev) {
                localStore.put(data);
              }
              seqStore.delete(seqCursor.primaryKey);
              seqCursor.continue();
            }
          };
        } else {
          cursor.continue();
        }
      } else if (cb) {
        cb();
      }
    };
  }

  // migration to version 4 (part 1)
  function addAttachAndSeqStore(db: {
    createObjectStore: (arg0: string, arg1: { autoIncrement: boolean }) => any;
  }) {
    const attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE, {
      autoIncrement: true,
    });
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', { unique: true });
  }

  // migration to version 4 (part 2)
  function migrateAttsAndSeqs(
    txn: { objectStore: (arg0: string) => any },
    callback: () => any,
  ) {
    const seqStore = txn.objectStore(BY_SEQ_STORE);
    const attStore = txn.objectStore(ATTACH_STORE);
    const attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);

    // need to actually populate the table. this is the expensive part,
    // so as an optimization, check first that this database even
    // contains attachments
    const req = attStore.count();
    req.onsuccess = function (e: { target: { result: any } }) {
      const count = e.target.result;
      if (!count) {
        return callback(); // done
      }

      seqStore.openCursor().onsuccess = function (e: {
        target: { result: any };
      }) {
        const cursor = e.target.result;
        if (!cursor) {
          return callback(); // done
        }
        const doc = cursor.value;
        const seq = cursor.primaryKey;
        const atts = Object.keys(doc._attachments || {});
        const digestMap: Record<string, any> = {};
        for (var j = 0; j < atts.length; j++) {
          const att = doc._attachments[atts[j]];
          digestMap[att.digest] = true; // uniq digests, just in case
        }
        const digests = Object.keys(digestMap);
        for (j = 0; j < digests.length; j++) {
          const digest = digests[j];
          attAndSeqStore.put({
            seq,
            digestSeq: digest + '::' + seq,
          });
        }
        cursor.continue();
      };
    };
  }

  // migration to version 5
  // Instead of relying on on-the-fly migration of metadata,
  // this brings the doc-store to its modern form:
  // - metadata.winningrev
  // - metadata.seq
  // - stringify the metadata when storing it
  function migrateMetadata(txn: { objectStore: (arg0: string) => any }) {
    function decodeMetadataCompat(storedObject: {
      data: any;
      deleted?: any;
      deletedOrLocal: any;
      winningRev?: any;
      seq?: any;
    }) {
      if (!storedObject.data) {
        // old format, when we didn't store it stringified
        storedObject.deleted = storedObject.deletedOrLocal === '1';
        return storedObject;
      }
      // @ts-expect-error fix-types
      return decodeMetadata(storedObject);
    }

    // ensure that every metadata has a winningRev and seq,
    // which was previously created on-the-fly but better to migrate
    const bySeqStore = txn.objectStore(BY_SEQ_STORE);
    const docStore = txn.objectStore(DOC_STORE);
    const cursor = docStore.openCursor();
    cursor.onsuccess = function (e: { target: { result: any } }) {
      const cursor = e.target.result;
      if (!cursor) {
        return; // done
      }
      const metadata = decodeMetadataCompat(cursor.value);

      metadata.winningRev =
        metadata.winningRev || calculateWinningRev(metadata);

      function fetchMetadataSeq() {
        // metadata.seq was added post-3.2.0, so if it's missing,
        // we need to fetch it manually
        const start = metadata.id + '::';
        const end = metadata.id + '::\uffff';
        const req = bySeqStore
          .index('_doc_id_rev')
          .openCursor(IDBKeyRange.bound(start, end));

        let metadataSeq = 0;
        req.onsuccess = function (e: { target: { result: any } }) {
          const cursor = e.target.result;
          if (!cursor) {
            metadata.seq = metadataSeq;
            return onGetMetadataSeq();
          }
          const seq = cursor.primaryKey;
          if (seq > metadataSeq) {
            metadataSeq = seq;
          }
          cursor.continue();
        };
      }

      function onGetMetadataSeq() {
        const metadataToStore = encodeMetadata(
          metadata,
          metadata.winningRev,
          metadata.deleted,
        );

        const req = docStore.put(metadataToStore);
        req.onsuccess = function () {
          cursor.continue();
        };
      }

      if (metadata.seq) {
        return onGetMetadataSeq();
      }

      fetchMetadataSeq();
    };
  }

  api._remote = false;
  api.type = function () {
    return 'idb';
  };

  api._id = toPromise(function (callback: (arg0: null, arg1: any) => void) {
    callback(null, api._meta.instanceId);
  });

  api._bulkDocs = function idb_bulkDocs(
    req: { docs: any },
    reqOpts: { new_edits: any },
    callback: any,
  ) {
    // @ts-expect-error fix-types
    idbBulkDocs(opts, req, reqOpts, api, idb, enrichCallbackError(callback));
  };

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api._get = function idb_get(
    id: any,
    opts: { ctx: any; rev: any; latest: any },
    callback: (
      arg0: unknown,
      arg1?: { doc: any; metadata: any; ctx: any },
    ) => void,
  ) {
    let doc: { _doc_id_rev: string; _id: any; _rev: any };
    let metadata: { winningRev: any; id: string };
    let err: any;
    let txn = opts.ctx;
    if (!txn) {
      const txnResult = openTransactionSafely(
        idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE],
        'readonly',
      );
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }

    function finish() {
      callback(err, { doc, metadata, ctx: txn });
    }

    txn.objectStore(DOC_STORE).get(id).onsuccess = function (e: {
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
      // we can determine the result here if:
      // 1. there is no such document
      // 2. the document is deleted and we don't ask about specific rev
      // When we ask with opts.rev we expect the answer to be either
      // doc (possibly with _deleted=true) or missing error
      if (!metadata) {
        err = createError(MISSING_DOC, 'missing');
        return finish();
      }

      let rev;
      if (!opts.rev) {
        rev = metadata.winningRev;
        // @ts-expect-error fix-types
        const deleted = isDeleted(metadata);
        if (deleted) {
          err = createError(MISSING_DOC, 'deleted');
          return finish();
        }
      } else {
        rev = opts.latest ? getLatest(opts.rev, metadata) : opts.rev;
      }

      const objectStore = txn.objectStore(BY_SEQ_STORE);
      const key = metadata.id + '::' + rev;

      objectStore.index('_doc_id_rev').get(key).onsuccess = function (e: {
        target: { result: any };
      }) {
        doc = e.target.result;
        if (doc) {
          doc = decodeDoc(doc);
        }
        if (!doc) {
          err = createError(MISSING_DOC, 'missing');
          return finish();
        }
        finish();
      };
    };
  };

  api._getAttachment = function (
    docId: any,
    attachId: any,
    attachment: { digest: any; content_type: any },
    opts: { ctx: any; binary: any },
    callback: (arg0: unknown, arg1?: undefined) => void,
  ) {
    let txn;
    if (opts.ctx) {
      txn = opts.ctx;
    } else {
      const txnResult = openTransactionSafely(
        idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE],
        'readonly',
      );
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }
    const digest = attachment.digest;
    const type = attachment.content_type;

    txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function (e: {
      target: { result: { body: any } };
    }) {
      const body = e.target.result.body;
      readBlobData(body, type, opts.binary, function (blobData) {
        callback(null, blobData);
      });
    };
  };

  api._info = function idb_info(
    callback: (
      arg0: unknown,
      arg1?: {
        doc_count: any;
        update_seq: any;
        // for debugging
        idb_attachment_format: string;
      },
    ) => void,
  ) {
    let updateSeq: any;
    let docCount: any;

    const txnResult = openTransactionSafely(
      idb,
      [META_STORE, BY_SEQ_STORE],
      'readonly',
    );
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    const txn = txnResult.txn;
    txn.objectStore(META_STORE).get(META_STORE).onsuccess = function (e: {
      target: { result: { docCount: any } };
    }) {
      docCount = e.target.result.docCount;
    };
    txn.objectStore(BY_SEQ_STORE).openKeyCursor(null, 'prev').onsuccess =
      function (e: { target: { result: any } }) {
        const cursor = e.target.result;
        updateSeq = cursor ? cursor.key : 0;
      };

    txn.oncomplete = function () {
      callback(null, {
        doc_count: docCount,
        update_seq: updateSeq,
        // for debugging
        idb_attachment_format: api._meta.blobSupport ? 'binary' : 'base64',
      });
    };
  };

  api._allDocs = function idb_allDocs(
    opts: {
      startkey: any;
      endkey: any;
      key: any;
      keys: any;
      // added in v2
      skip: number;
      limit: any;
      inclusive_end: boolean;
      descending: any;
      attachments: any; // added in v3
      // added in v3
      update_seq: any;
      conflicts: any;
      include_docs: any;
      binary: any; // added in v4
    },
    callback: any,
  ) {
    // @ts-expect-error fix-types
    idbAllDocs(opts, idb, enrichCallbackError(callback));
  };

  api._changes = function idbChanges(opts: {
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
  }) {
    return changes(opts, api, dbName, idb);
  };

  api._close = function (callback: () => void) {
    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    cachedDBs.delete(dbName);
    callback();
  };

  api._getRevisionTree = function (
    docId: any,
    callback: (arg0: unknown, arg1?: undefined) => void,
  ) {
    const txnResult = openTransactionSafely(idb, [DOC_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    const txn = txnResult.txn;
    const req = txn.objectStore(DOC_STORE).get(docId);
    req.onsuccess = function (event: {
      target: {
        result: {
          data: any;
          winningRev: any;
          deletedOrLocal: string;
          seq: any;
        };
      };
    }) {
      const doc = decodeMetadata(event.target.result);
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        callback(null, doc.rev_tree);
      }
    };
  };

  // This function removes revisions of document docId
  // which are listed in revs and sets this document
  // revision to to rev_tree
  api._doCompaction = function (
    docId: string,
    revs: string | any[],
    callback: (arg0?: unknown) => void,
  ) {
    const stores = [
      DOC_STORE,
      BY_SEQ_STORE,
      ATTACH_STORE,
      ATTACH_AND_SEQ_STORE,
    ];
    const txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    const txn = txnResult.txn;

    const docStore = txn.objectStore(DOC_STORE);

    docStore.get(docId).onsuccess = function (event: {
      target: {
        result: {
          data: any;
          winningRev: any;
          deletedOrLocal: string;
          seq: any;
        };
      };
    }) {
      const metadata = decodeMetadata(event.target.result);
      traverseRevTree(
        metadata.rev_tree,
        function (
          isLeaf: any,
          pos: string,
          revHash: string,
          ctx: any,
          opts: { status: string },
        ) {
          const rev = pos + '-' + revHash;
          if (revs.indexOf(rev) !== -1) {
            opts.status = 'missing';
          }
        },
      );
      // @ts-expect-error fix-types
      compactRevs(revs, docId, txn);
      const winningRev = metadata.winningRev;
      const deleted = metadata.deleted;
      txn
        .objectStore(DOC_STORE)
        .put(encodeMetadata(metadata, winningRev, deleted));
    };
    txn.onabort = idbError(callback);
    txn.oncomplete = function () {
      callback();
    };
  };

  api._getLocal = function (
    id: any,
    callback: (arg0: unknown, arg1?: undefined) => void,
  ) {
    const txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    const tx = txnResult.txn;
    const req = tx.objectStore(LOCAL_STORE).get(id);

    // @ts-expect-error fix-types
    req.onerror = idbError(callback);
    req.onsuccess = function (e: { target: { result: any } }) {
      const doc = e.target.result;
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        delete doc['_doc_id_rev']; // for backwards compat
        callback(null, doc);
      }
    };
  };

  api._putLocal = function (
    doc: { _revisions: any; _rev: string; _id: any },
    opts: { ctx?: any },
    callback: (
      arg0: unknown,
      arg1?: { ok: boolean; id: any; rev: any },
    ) => void,
  ) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    delete doc._revisions; // ignore this, trust the rev
    const oldRev = doc._rev;
    const id = doc._id;
    if (!oldRev) {
      doc._rev = '0-1';
    } else {
      doc._rev = '0-' + (parseInt(oldRev.split('-')[1], 10) + 1);
    }

    let tx = opts.ctx;
    let ret: { ok: boolean; id: any; rev: any };
    if (!tx) {
      const txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      // @ts-expect-error fix-types
      tx.onerror = idbError(callback);
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }

    const oStore = tx.objectStore(LOCAL_STORE);
    let req;
    if (oldRev) {
      req = oStore.get(id);
      req.onsuccess = function (e: { target: { result: any } }) {
        const oldDoc = e.target.result;
        if (!oldDoc || oldDoc._rev !== oldRev) {
          callback(createError(REV_CONFLICT));
        } else {
          // update
          const req = oStore.put(doc);
          req.onsuccess = function () {
            ret = { ok: true, id: doc._id, rev: doc._rev };
            if (opts.ctx) {
              // return immediately
              callback(null, ret);
            }
          };
        }
      };
    } else {
      // new doc
      req = oStore.add(doc);
      req.onerror = function (e: {
        preventDefault: () => void;
        stopPropagation: () => void;
      }) {
        // constraint error, already exists
        callback(createError(REV_CONFLICT));
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
      };
      req.onsuccess = function () {
        ret = { ok: true, id: doc._id, rev: doc._rev };
        if (opts.ctx) {
          // return immediately
          callback(null, ret);
        }
      };
    }
  };

  api._removeLocal = function (
    doc: { _id: any; _rev: any },
    opts: { ctx?: any },
    callback: (
      arg0: unknown,
      arg1?: { ok: boolean; id: any; rev: string },
    ) => void,
  ) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    let tx = opts.ctx;
    if (!tx) {
      const txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }
    let ret: { ok: boolean; id: any; rev: string };
    const id = doc._id;
    const oStore = tx.objectStore(LOCAL_STORE);
    const req = oStore.get(id);

    // @ts-expect-error fix-types
    req.onerror = idbError(callback);
    req.onsuccess = function (e: { target: { result: any } }) {
      const oldDoc = e.target.result;
      if (!oldDoc || oldDoc._rev !== doc._rev) {
        callback(createError(MISSING_DOC));
      } else {
        oStore.delete(id);
        ret = { ok: true, id, rev: '0-0' };
        if (opts.ctx) {
          // return immediately
          callback(null, ret);
        }
      }
    };
  };

  api._destroy = function (
    opts: any,
    callback: (arg0: null, arg1: { ok: boolean }) => void,
  ) {
    // @ts-expect-error fix-types
    changesHandler.removeAllListeners(dbName);

    //Close open request for "dbName" database to fix ie delay.
    const openReq = openReqList.get(dbName);
    if (openReq && openReq.result) {
      openReq.result.close();
      cachedDBs.delete(dbName);
    }
    const req = indexedDB.deleteDatabase(dbName);

    req.onsuccess = function () {
      //Remove open request from the list.
      openReqList.delete(dbName);
      if (hasLocalStorage() && dbName in localStorage) {
        delete localStorage[dbName];
      }
      callback(null, { ok: true });
    };

    // @ts-expect-error fix-types
    req.onerror = idbError(callback);
  };

  const cached = cachedDBs.get(dbName);

  if (cached) {
    idb = cached.idb;
    api._meta = cached.global;
    return nextTick(function () {
      // @ts-expect-error fix-types
      callback(null, api);
    });
  }

  const req = indexedDB.open(dbName, ADAPTER_VERSION);
  openReqList.set(dbName, req);

  req.onupgradeneeded = function (e) {
    // @ts-expect-error fix-types
    const db = e.target.result;
    if (e.oldVersion < 1) {
      return createSchema(db); // new db, initial schema
    }
    // do migrations

    // @ts-expect-error fix-types
    const txn = e.currentTarget.transaction;
    // these migrations have to be done in this function, before
    // control is returned to the event loop, because IndexedDB

    if (e.oldVersion < 3) {
      createLocalStoreSchema(db); // v2 -> v3
    }
    if (e.oldVersion < 4) {
      addAttachAndSeqStore(db); // v3 -> v4
    }

    const migrations = [
      addDeletedOrLocalIndex, // v1 -> v2
      migrateLocalStore, // v2 -> v3
      migrateAttsAndSeqs, // v3 -> v4
      migrateMetadata, // v4 -> v5
    ];

    let i = e.oldVersion;

    function next() {
      const migration = migrations[i - 1];
      i++;
      if (migration) {
        migration(txn, next);
      }
    }

    next();
  };

  req.onsuccess = function (e) {
    // @ts-expect-error fix-types
    idb = e.target.result;

    idb.onversionchange = function () {
      idb.close();
      cachedDBs.delete(dbName);
    };

    idb.onabort = function (e: { target: { error: any } }) {
      guardedConsole('error', 'Database has a global failure', e.target.error);
      idbGlobalFailureError = e.target.error;
      idb.close();
      cachedDBs.delete(dbName);
    };

    // Do a few setup operations (in parallel as much as possible):
    // 1. Fetch meta doc
    // 2. Check blob support
    // 3. Calculate docCount
    // 4. Generate an instanceId if necessary
    // 5. Store docCount and instanceId on meta doc

    const txn = idb.transaction(
      [META_STORE, DETECT_BLOB_SUPPORT_STORE, DOC_STORE],
      'readwrite',
    );

    let storedMetaDoc = false;
    let metaDoc: { [x: string]: string; docCount: any };
    let docCount: any;
    let blobSupport: any;
    let instanceId: string;

    function completeSetup() {
      if (typeof blobSupport === 'undefined' || !storedMetaDoc) {
        return;
      }
      api._meta = {
        name: dbName,
        instanceId,
        blobSupport,
      };

      cachedDBs.set(dbName, {
        idb,
        global: api._meta,
      });
      // @ts-expect-error fix-types
      callback(null, api);
    }

    function storeMetaDocIfReady() {
      if (typeof docCount === 'undefined' || typeof metaDoc === 'undefined') {
        return;
      }
      const instanceKey = dbName + '_id';
      if (instanceKey in metaDoc) {
        instanceId = metaDoc[instanceKey];
      } else {
        metaDoc[instanceKey] = instanceId = uuid();
      }
      metaDoc.docCount = docCount;
      txn.objectStore(META_STORE).put(metaDoc);
    }

    //
    // fetch or generate the instanceId
    //
    txn.objectStore(META_STORE).get(META_STORE).onsuccess = function (e: {
      target: { result: { id: string } };
    }) {
      // @ts-expect-error fix-types
      metaDoc = e.target.result || { id: META_STORE };
      storeMetaDocIfReady();
    };

    //
    // countDocs
    //
    countDocs(txn, function (count) {
      docCount = count;
      storeMetaDocIfReady();
    });

    //
    // check blob support
    //
    if (!blobSupportPromise) {
      // make sure blob support is only checked once
      blobSupportPromise = checkBlobSupport(
        txn,
        DETECT_BLOB_SUPPORT_STORE,
        'key',
      );
    }

    blobSupportPromise.then(function (val: any) {
      blobSupport = val;
      completeSetup();
    });

    // only when the metadata put transaction has completed,
    // consider the setup done
    txn.oncomplete = function () {
      storedMetaDoc = true;
      completeSetup();
    };
    // @ts-expect-error fix-types
    txn.onabort = idbError(callback);
  };

  req.onerror = function (e) {
    // @ts-expect-error fix-types
    let msg = e.target.error && e.target.error.message;

    if (!msg) {
      msg = 'Failed to open indexedDB, are you in private browsing mode?';
    } else if (msg.indexOf('stored database is a higher version') !== -1) {
      msg = new Error(
        'This DB was created with the newer "indexeddb" adapter, but you are trying to open it with the older "idb" adapter',
      );
    }

    guardedConsole('error', msg);
    callback(createError(IDB_ERROR, msg));
  };
}

IdbPouch.valid = function () {
  // Following #7085 buggy idb versions (typically Safari < 10.1) are
  // considered valid.

  // On Firefox SecurityError is thrown while referencing indexedDB if cookies
  // are not allowed. `typeof indexedDB` also triggers the error.
  try {
    // some outdated implementations of IDB that appear on Samsung
    // and HTC Android devices <4.4 are missing IDBKeyRange
    return (
      typeof indexedDB !== 'undefined' && typeof IDBKeyRange !== 'undefined'
    );
  } catch (e) {
    return false;
  }
};

export default function (PouchDB: {
  adapter: (arg0: string, arg1: typeof IdbPouch, arg2: boolean) => void;
}) {
  PouchDB.adapter('idb', IdbPouch, true);
}
