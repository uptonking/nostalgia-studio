import {
  isLocalId,
  parseDoc,
  preprocessAttachments,
  processDocs,
} from 'pouchdb-adapter-utils';
import { createError, MISSING_STUB } from 'pouchdb-errors';
import { compactTree } from 'pouchdb-merge';

import changesHandler from './changesHandler';
import {
  ATTACH_AND_SEQ_STORE,
  ATTACH_STORE,
  BY_SEQ_STORE,
  DOC_STORE,
  LOCAL_STORE,
  META_STORE,
} from './constants';
import {
  compactRevs,
  decodeMetadata,
  encodeMetadata,
  idbError,
  openTransactionSafely,
} from './utils';

function idbBulkDocs(
  dbOpts: { revs_limit: any },
  req: { docs: any },
  opts: { new_edits: any },
  api: { _meta: { blobSupport: any; name: any }; auto_compaction: any },
  idb: { transaction: (arg0: any, arg1: any) => any },
  callback: {
    (error: any, result?: any): void;
    (arg0: unknown, arg1: any[]): void;
  },
) {
  const docInfos = req.docs;
  let txn: {
    onabort?: any;
    ontimeout?: any;
    oncomplete?: any;
    objectStore: any;
  };
  let docStore: {
    get: (arg0: any) => any;
    put: (arg0: {
      data: any;
      winningRev: any;
      deletedOrLocal: string;
      seq: any;
      id: any;
    }) => any;
  };
  let bySeqStore: {
    index: (arg0: string) => any;
    put: (arg0: any, arg1?: undefined) => any;
  };
  let attachStore: {
    get: (arg0: any) => any;
    count: (arg0: any) => any;
    put: (arg0: { digest: any; body: any }) => any;
  };
  let attachAndSeqStore: {
    put: (arg0: { seq: any; digestSeq: string }) => any;
  };
  let metaStore: {
    get: (arg0: string) => {
      (): any;
      new (): any;
      onsuccess: (e: any) => void;
    };
    put: (arg0: any) => void;
  };
  let docInfoError;
  let metaDoc: { docCount: number };

  for (let i = 0, len = docInfos.length; i < len; i++) {
    let doc = docInfos[i];
    if (doc._id && isLocalId(doc._id)) {
      continue;
    }
    doc = docInfos[i] = parseDoc(doc, opts.new_edits, dbOpts);
    if (doc.error && !docInfoError) {
      docInfoError = doc;
    }
  }

  if (docInfoError) {
    return callback(docInfoError);
  }

  let allDocsProcessed = false;
  let docCountDelta = 0;
  const results = new Array(docInfos.length);
  const fetchedDocs = new Map();
  let preconditionErrored = false;
  const blobType = api._meta.blobSupport ? 'blob' : 'base64';

  preprocessAttachments(docInfos, blobType, function (err: any) {
    if (err) {
      return callback(err);
    }
    startTransaction();
  });

  function startTransaction() {
    const stores = [
      DOC_STORE,
      BY_SEQ_STORE,
      ATTACH_STORE,
      LOCAL_STORE,
      ATTACH_AND_SEQ_STORE,
      META_STORE,
    ];
    const txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    txn = txnResult.txn;
    txn.onabort = idbError(callback);
    txn.ontimeout = idbError(callback);
    txn.oncomplete = complete;
    docStore = txn.objectStore(DOC_STORE);
    bySeqStore = txn.objectStore(BY_SEQ_STORE);
    attachStore = txn.objectStore(ATTACH_STORE);
    attachAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);
    metaStore = txn.objectStore(META_STORE);

    metaStore.get(META_STORE).onsuccess = function (e: {
      target: { result: any };
    }) {
      metaDoc = e.target.result;
      updateDocCountIfReady();
    };

    verifyAttachments(function (err: any) {
      if (err) {
        preconditionErrored = true;
        return callback(err);
      }
      fetchExistingDocs();
    });
  }

  function onAllDocsProcessed() {
    allDocsProcessed = true;
    updateDocCountIfReady();
  }

  function idbProcessDocs() {
    processDocs(
      dbOpts.revs_limit,
      docInfos,
      api,
      fetchedDocs,
      txn,
      results,
      writeDoc,
      opts,
      onAllDocsProcessed,
    );
  }

  function updateDocCountIfReady() {
    if (!metaDoc || !allDocsProcessed) {
      return;
    }
    // caching the docCount saves a lot of time in allDocs() and
    // info(), which is why we go to all the trouble of doing this
    metaDoc.docCount += docCountDelta;
    metaStore.put(metaDoc);
  }

  function fetchExistingDocs() {
    if (!docInfos.length) {
      return;
    }

    let numFetched = 0;

    function checkDone() {
      if (++numFetched === docInfos.length) {
        idbProcessDocs();
      }
    }

    function readMetadata(event: {
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

      if (metadata) {
        fetchedDocs.set(metadata.id, metadata);
      }
      checkDone();
    }

    for (let i = 0, len = docInfos.length; i < len; i++) {
      const docInfo = docInfos[i];
      if (docInfo._id && isLocalId(docInfo._id)) {
        checkDone(); // skip local docs
        continue;
      }
      const req = docStore.get(docInfo.metadata.id);
      req.onsuccess = readMetadata;
    }
  }

  function complete() {
    if (preconditionErrored) {
      return;
    }

    changesHandler.notify(api._meta.name);
    callback(null, results);
  }

  function verifyAttachment(
    digest: string,
    callback: { (attErr?: any): void; (arg0: undefined): void },
  ) {
    const req = attachStore.get(digest);
    req.onsuccess = function (e: { target: { result: any } }) {
      if (!e.target.result) {
        const err = createError(
          MISSING_STUB,
          'unknown stub attachment with digest ' + digest,
        );
        err.status = 412;
        callback(err);
      } else {
        callback();
      }
    };
  }

  function verifyAttachments(finish: {
    (err?: any): any;
    (arg0: undefined): void;
  }) {
    const digests: any[] = [];
    docInfos.forEach(function (docInfo: {
      data: { _attachments: { [x: string]: any } };
    }) {
      if (docInfo.data && docInfo.data._attachments) {
        Object.keys(docInfo.data._attachments).forEach(function (filename) {
          const att = docInfo.data._attachments[filename];
          if (att.stub) {
            digests.push(att.digest);
          }
        });
      }
    });
    if (!digests.length) {
      return finish();
    }
    let numDone = 0;
    let err: any;

    function checkDone() {
      if (++numDone === digests.length) {
        finish(err);
      }
    }
    digests.forEach(function (digest) {
      verifyAttachment(digest, function (attErr: any) {
        if (attErr && !err) {
          err = attErr;
        }
        checkDone();
      });
    });
  }

  function writeDoc(
    docInfo: {
      metadata: { winningRev: any; deleted: any; id: any; rev: any };
      data: any;
    },
    winningRev: any,
    winningRevIsDeleted: any,
    newRevIsDeleted: any,
    isUpdate: any,
    delta: number,
    resultsIdx: any,
    callback: any,
  ) {
    docInfo.metadata.winningRev = winningRev;
    docInfo.metadata.deleted = winningRevIsDeleted;

    const doc = docInfo.data;
    doc._id = docInfo.metadata.id;
    doc._rev = docInfo.metadata.rev;

    if (newRevIsDeleted) {
      doc._deleted = true;
    }

    const hasAttachments =
      doc._attachments && Object.keys(doc._attachments).length;
    if (hasAttachments) {
      return writeAttachments(
        docInfo,
        winningRev,
        winningRevIsDeleted,
        isUpdate,
        resultsIdx,
        callback,
      );
    }

    docCountDelta += delta;
    updateDocCountIfReady();

    finishDoc(
      // @ts-expect-error fix-types
      docInfo,
      winningRev,
      winningRevIsDeleted,
      isUpdate,
      resultsIdx,
      callback,
    );
  }

  function finishDoc(
    docInfo: { data: any; metadata: { id: string }; stemmedRevs: any[] },
    winningRev: any,
    winningRevIsDeleted: any,
    isUpdate: any,
    resultsIdx: number,
    callback: any,
  ) {
    const doc = docInfo.data;
    const metadata: any = docInfo.metadata;

    doc._doc_id_rev = metadata.id + '::' + metadata.rev;
    delete doc._id;
    delete doc._rev;

    function afterPutDoc(e: { target: { result: any } }) {
      let revsToDelete = docInfo.stemmedRevs || [];

      if (isUpdate && api.auto_compaction) {
        revsToDelete = revsToDelete.concat(compactTree(docInfo.metadata));
      }

      if (revsToDelete && revsToDelete.length) {
        compactRevs(revsToDelete, docInfo.metadata.id, txn);
      }

      metadata.seq = e.target.result;
      // Current _rev is calculated from _rev_tree on read
      // delete metadata.rev;
      const metadataToStore = encodeMetadata(
        metadata,
        winningRev,
        winningRevIsDeleted,
      );
      const metaDataReq = docStore.put(metadataToStore);
      metaDataReq.onsuccess = afterPutMetadata;
    }

    function afterPutDocError(e: {
      preventDefault: () => void;
      stopPropagation: () => void;
    }) {
      // ConstraintError, need to update, not put (see #1638 for details)
      e.preventDefault(); // avoid transaction abort
      e.stopPropagation(); // avoid transaction onerror
      const index = bySeqStore.index('_doc_id_rev');
      const getKeyReq = index.getKey(doc._doc_id_rev);
      getKeyReq.onsuccess = function (e: { target: { result: any } }) {
        const putReq = bySeqStore.put(doc, e.target.result);
        putReq.onsuccess = afterPutDoc;
      };
    }

    function afterPutMetadata() {
      results[resultsIdx] = {
        ok: true,
        id: metadata.id,
        rev: metadata.rev,
      };
      fetchedDocs.set(docInfo.metadata.id, docInfo.metadata);
      insertAttachmentMappings(docInfo, metadata.seq, callback);
    }

    const putReq = bySeqStore.put(doc);

    putReq.onsuccess = afterPutDoc;
    putReq.onerror = afterPutDocError;
  }

  function writeAttachments(
    docInfo: { data: { _attachments: { [x: string]: any } } },
    winningRev: string,
    winningRevIsDeleted: any,
    isUpdate: any,
    resultsIdx: any,
    callback: any,
  ) {
    const doc = docInfo.data;

    let numDone = 0;
    const attachments = Object.keys(doc._attachments);

    function collectResults() {
      if (numDone === attachments.length) {
        finishDoc(
          // @ts-expect-error fix-types
          docInfo,
          winningRev,
          winningRevIsDeleted,
          isUpdate,
          resultsIdx,
          callback,
        );
      }
    }

    function attachmentSaved() {
      numDone++;
      collectResults();
    }

    attachments.forEach(function (key) {
      const att = docInfo.data._attachments[key];
      if (!att.stub) {
        const data = att.data;
        delete att.data;
        att.revpos = parseInt(winningRev, 10);
        const digest = att.digest;
        saveAttachment(digest, data, attachmentSaved);
      } else {
        numDone++;
        collectResults();
      }
    });
  }

  // map seqs to attachment digests, which
  // we will need later during compaction
  function insertAttachmentMappings(
    docInfo: { data: { _attachments: { [x: string]: { digest: any } } } },
    seq: string,
    callback: () => void,
  ) {
    let attsAdded = 0;
    const attsToAdd = Object.keys(docInfo.data._attachments || {});

    if (!attsToAdd.length) {
      return callback();
    }

    function checkDone() {
      if (++attsAdded === attsToAdd.length) {
        callback();
      }
    }

    function add(att: string) {
      const digest = docInfo.data._attachments[att].digest;
      const req = attachAndSeqStore.put({
        seq,
        digestSeq: digest + '::' + seq,
      });

      req.onsuccess = checkDone;
      req.onerror = function (e: {
        preventDefault: () => void;
        stopPropagation: () => void;
      }) {
        // this callback is for a constaint error, which we ignore
        // because this docid/rev has already been associated with
        // the digest (e.g. when new_edits == false)
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
        checkDone();
      };
    }
    for (let i = 0; i < attsToAdd.length; i++) {
      add(attsToAdd[i]); // do in parallel
    }
  }

  function saveAttachment(
    digest: any,
    data: any,
    callback: { (): void; (): any },
  ) {
    const getKeyReq = attachStore.count(digest);
    getKeyReq.onsuccess = function (e: { target: { result: any } }) {
      const count = e.target.result;
      if (count) {
        return callback(); // already exists
      }
      const newAtt = {
        digest,
        body: data,
      };
      const putReq = attachStore.put(newAtt);
      putReq.onsuccess = callback;
    };
  }
}

export default idbBulkDocs;
