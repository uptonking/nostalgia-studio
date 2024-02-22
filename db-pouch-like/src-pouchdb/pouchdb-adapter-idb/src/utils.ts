import {
  base64StringToBlobOrBuffer as b64StringToBlob,
  blob as createBlob,
  btoa,
  readAsBinaryString,
} from 'pouchdb-binary-utils';
import { createError, IDB_ERROR } from 'pouchdb-errors';
import { safeJsonParse, safeJsonStringify } from 'pouchdb-json';
import { pick } from 'pouchdb-utils';

import { ATTACH_AND_SEQ_STORE, ATTACH_STORE, BY_SEQ_STORE } from './constants';

function idbError(callback: {
  (error: any, result?: any): void;
  (arg0: unknown, arg1: { total_rows: any; offset: any; rows: any[] }): void;
  (arg0: any): void;
}) {
  return function (evt: {
    target: { error: { name: any; message: any } };
    type: any;
  }) {
    let message = 'unknown_error';
    if (evt.target && evt.target.error) {
      message = evt.target.error.name || evt.target.error.message;
    }
    callback(createError(IDB_ERROR, message, evt.type));
  };
}

// Unfortunately, the metadata has to be stringified
// when it is put into the database, because otherwise
// IndexedDB can throw errors for deeply-nested objects.
// Originally we just used JSON.parse/JSON.stringify; now
// we use this custom vuvuzela library that avoids recursion.
// If we could do it all over again, we'd probably use a
// format for the revision trees other than JSON.
function encodeMetadata(
  metadata: { seq: any; id: any },
  winningRev: any,
  deleted: any,
) {
  return {
    data: safeJsonStringify(metadata),
    winningRev,
    deletedOrLocal: deleted ? '1' : '0',
    seq: metadata.seq, // highest seq for this doc
    id: metadata.id,
  };
}

function decodeMetadata(storedObject: {
  data: any;
  winningRev: any;
  deletedOrLocal: string;
  seq: any;
}) {
  if (!storedObject) {
    return null;
  }
  const metadata = safeJsonParse(storedObject.data);
  metadata.winningRev = storedObject.winningRev;
  metadata.deleted = storedObject.deletedOrLocal === '1';
  metadata.seq = storedObject.seq;
  return metadata;
}

// read the doc back out from the database. we don't store the
// _id or _rev because we already have _doc_id_rev.
function decodeDoc(doc: { _doc_id_rev: string; _id: any; _rev: any }) {
  if (!doc) {
    return doc;
  }
  const idx = doc._doc_id_rev.lastIndexOf(':');
  doc._id = doc._doc_id_rev.substring(0, idx - 1);
  doc._rev = doc._doc_id_rev.substring(idx + 1);
  delete doc._doc_id_rev;
  return doc;
}

// Read a blob from the database, encoding as necessary
// and translating from base64 if the IDB doesn't support
// native Blobs
function readBlobData(
  body: any,
  type: any,
  asBlob: any,
  callback: { (data: any): void; (blobData: any): void; (arg0: string): void },
) {
  if (asBlob) {
    if (!body) {
      callback(createBlob([''], { type }));
    } else if (typeof body !== 'string') {
      // we have blob support
      callback(body);
    } else {
      // no blob support
      callback(b64StringToBlob(body, type));
    }
  } else {
    // as base64 string
    if (!body) {
      callback('');
    } else if (typeof body !== 'string') {
      // we have blob support
      readAsBinaryString(body, function (binary: string) {
        callback(btoa(binary));
      });
    } else {
      // no blob support
      callback(body);
    }
  }
}

function fetchAttachmentsIfNecessary(
  doc: { _attachments: { [x: string]: { stub: boolean } } },
  opts: {
    startkey?: any;
    endkey?: any;
    key?: any;
    keys?: any;
    skip?: number;
    limit?: any;
    inclusive_end?: boolean;
    descending?: any;
    attachments: any;
    update_seq?: any;
    conflicts?: any;
    include_docs: any;
    binary?: any;
  },
  txn: {
    objectStore: (arg0: string) => {
      (): any;
      new (): any;
      get: { (arg0: any): any; new (): any };
    };
  },
  cb?: { (): void; (): void },
) {
  const attachments = Object.keys(doc._attachments || {});
  if (!attachments.length) {
    return cb && cb();
  }
  let numDone = 0;

  function checkDone() {
    if (++numDone === attachments.length && cb) {
      cb();
    }
  }

  function fetchAttachment(doc: { _attachments: any }, att: string) {
    const attObj = doc._attachments[att];
    const digest = attObj.digest;
    const req = txn.objectStore(ATTACH_STORE).get(digest);
    req.onsuccess = function (e: { target: { result: { body: any } } }) {
      attObj.body = e.target.result.body;
      checkDone();
    };
  }

  attachments.forEach(function (att) {
    if (opts.attachments && opts.include_docs) {
      fetchAttachment(doc, att);
    } else {
      doc._attachments[att].stub = true;
      checkDone();
    }
  });
}

// IDB-specific postprocessing necessary because
// we don't know whether we stored a true Blob or
// a base64-encoded string, and if it's a Blob it
// needs to be read outside of the transaction context
function postProcessAttachments(results: any[], asBlob: undefined) {
  return Promise.all(
    results.map(function (row: {
      doc: { _attachments: { [x: string]: { data: any } } };
    }) {
      if (row.doc && row.doc._attachments) {
        const attNames = Object.keys(row.doc._attachments);
        return Promise.all(
          attNames.map(function (att) {
            const attObj: any = row.doc._attachments[att];
            if (!('body' in attObj)) {
              // already processed
              return;
            }
            const body = attObj.body;
            const type = attObj.content_type;
            return new Promise(function (resolve) {
              readBlobData(body, type, asBlob, function (data: any) {
                row.doc._attachments[att] = Object.assign(
                  pick(attObj, ['digest', 'content_type']),
                  { data },
                );
                resolve(undefined);
              });
            });
          }),
        );
      }
    }),
  );
}

function compactRevs(
  revs: any[],
  docId: string,
  txn: { objectStore: (arg0: string) => any },
) {
  const possiblyOrphanedDigests: any[] = [];
  const seqStore = txn.objectStore(BY_SEQ_STORE);
  const attStore = txn.objectStore(ATTACH_STORE);
  const attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);
  let count = revs.length;

  function checkDone() {
    count--;
    if (!count) {
      // done processing all revs
      deleteOrphanedAttachments();
    }
  }

  function deleteOrphanedAttachments() {
    if (!possiblyOrphanedDigests.length) {
      return;
    }
    possiblyOrphanedDigests.forEach(function (digest) {
      const countReq = attAndSeqStore
        .index('digestSeq')
        .count(
          IDBKeyRange.bound(digest + '::', digest + '::\uffff', false, false),
        );
      countReq.onsuccess = function (e: { target: { result: any } }) {
        const count = e.target.result;
        if (!count) {
          // orphaned
          attStore.delete(digest);
        }
      };
    });
  }

  revs.forEach(function (rev: string) {
    const index = seqStore.index('_doc_id_rev');
    const key = docId + '::' + rev;
    index.getKey(key).onsuccess = function (e: { target: { result: any } }) {
      const seq = e.target.result;
      if (typeof seq !== 'number') {
        return checkDone();
      }
      seqStore.delete(seq);

      const cursor = attAndSeqStore
        .index('seq')
        .openCursor(IDBKeyRange.only(seq));

      cursor.onsuccess = function (event: { target: { result: any } }) {
        const cursor = event.target.result;
        if (cursor) {
          const digest = cursor.value.digestSeq.split('::')[0];
          possiblyOrphanedDigests.push(digest);
          attAndSeqStore.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          // done
          checkDone();
        }
      };
    };
  });
}

function openTransactionSafely(
  idb: { transaction: (arg0: any, arg1: any) => any },
  stores: string[],
  mode: string,
) {
  try {
    return {
      txn: idb.transaction(stores, mode),
    };
  } catch (err) {
    return {
      error: err,
    };
  }
}

export {
  fetchAttachmentsIfNecessary,
  openTransactionSafely,
  compactRevs,
  postProcessAttachments,
  idbError,
  encodeMetadata,
  decodeMetadata,
  decodeDoc,
  readBlobData,
};
