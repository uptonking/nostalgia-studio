import Deque from 'double-ended-queue';
import levelup from 'levelup';
import {
  allDocsKeysQuery,
  isDeleted,
  isLocalId,
  parseDoc,
  processDocs,
} from 'pouchdb-adapter-utils';
import {
  atob,
  binaryStringToBlobOrBuffer as binStringToBluffer,
} from 'pouchdb-binary-utils';
import PouchDB from 'pouchdb-core';
import {
  BAD_ARG,
  createError,
  MISSING_DOC,
  MISSING_STUB,
  NOT_OPEN,
  REV_CONFLICT,
} from 'pouchdb-errors';
import { safeJsonParse, safeJsonStringify } from 'pouchdb-json';
import { binaryMd5 } from 'pouchdb-md5';
import {
  collectConflicts,
  compactTree,
  latest as getLatest,
  traverseRevTree,
  winningRev as calculateWinningRev,
} from 'pouchdb-merge';
import {
  changesHandler as Changes,
  clone,
  filterChange,
  functionName,
  nextTick,
  uuid,
} from 'pouchdb-utils';
import sublevel from 'sublevel-pouchdb';
import { obj as through } from 'through2';

import createEmptyBluffer from './createEmptyBlobOrBuffer';
import prepareAttachmentForStorage from './prepareAttachmentForStorage';
import readAsBluffer from './readAsBlobOrBuffer';
import LevelTransaction from './transaction';

const DOC_STORE = 'document-store';
const BY_SEQ_STORE = 'by-sequence';
const ATTACHMENT_STORE = 'attach-store';
const BINARY_STORE = 'attach-binary-store';
const LOCAL_STORE = 'local-store';
const META_STORE = 'meta-store';

// leveldb barks if we try to open a db multiple times
// so we cache opened connections here for initstore()
const dbStores = new Map();

// store the value of update_seq in the by-sequence store the key name will
// never conflict, since the keys in the by-sequence store are integers
const UPDATE_SEQ_KEY = '_local_last_update_seq';
const DOC_COUNT_KEY = '_local_doc_count';
const UUID_KEY = '_local_uuid';

const MD5_PREFIX = 'md5-';

const safeJsonEncoding = {
  encode: safeJsonStringify,
  decode: safeJsonParse,
  buffer: false,
  type: 'cheap-json',
};

const levelChanges = new Changes();

// winningRev and deleted are performance-killers, but
// in newer versions of PouchDB, they are cached on the metadata
function getWinningRev(metadata) {
  return 'winningRev' in metadata
    ? metadata.winningRev
    : calculateWinningRev(metadata);
}

function getIsDeleted(metadata, winningRev) {
  return 'deleted' in metadata
    ? metadata.deleted
    : isDeleted(metadata, winningRev);
}

function fetchAttachment(att, stores, opts) {
  const type = att.content_type;
  return new Promise(function (resolve, reject) {
    stores.binaryStore.get(att.digest, function (err, buffer) {
      let data;
      if (err) {
        /* istanbul ignore if */
        if (err.name !== 'NotFoundError') {
          return reject(err);
        } else {
          // empty
          if (!opts.binary) {
            data = '';
          } else {
            data = binStringToBluffer('', type);
          }
        }
      } else {
        // non-empty
        if (opts.binary) {
          data = readAsBluffer(buffer, type);
        } else {
          data = buffer.toString('base64');
        }
      }
      delete att.stub;
      delete att.length;
      att.data = data;
      resolve(undefined);
    });
  });
}

function fetchAttachments(results, stores, opts) {
  const atts = [];
  results.forEach(function (row) {
    if (!(row.doc && row.doc._attachments)) {
      return;
    }
    const attNames = Object.keys(row.doc._attachments);
    attNames.forEach(function (attName) {
      const att = row.doc._attachments[attName];
      if (!('data' in att)) {
        atts.push(att);
      }
    });
  });

  return Promise.all(
    atts.map(function (att) {
      return fetchAttachment(att, stores, opts);
    }),
  );
}

function LevelPouch(opts, callback) {
  opts = clone(opts);
  // @ts-expect-error fix-types
  const api = this;
  let instanceId;
  const stores: Record<string, any> = {};
  const revLimit = opts.revs_limit;
  let db;
  const name = opts.name;
  // TODO: this is undocumented and unused probably
  /* istanbul ignore else */
  if (typeof opts.createIfMissing === 'undefined') {
    opts.createIfMissing = true;
  }

  const leveldown = opts.db;

  let dbStore;
  const leveldownName = functionName(leveldown);
  if (dbStores.has(leveldownName)) {
    dbStore = dbStores.get(leveldownName);
  } else {
    dbStore = new Map();
    dbStores.set(leveldownName, dbStore);
  }
  if (dbStore.has(name)) {
    db = dbStore.get(name);
    afterDBCreated();
  } else {
    dbStore.set(
      name,
      sublevel(
        levelup(leveldown(name), opts, function (err) {
          /* istanbul ignore if */
          if (err) {
            dbStore.delete(name);
            return callback(err);
          }
          db = dbStore.get(name);
          db._docCount = -1;
          db._queue = new Deque();
          /* istanbul ignore else */
          if (typeof opts.migrate === 'object') {
            // migration for leveldown
            opts.migrate.doMigrationOne(name, db, afterDBCreated);
          } else {
            afterDBCreated();
          }
        }),
      ),
    );
  }

  function afterDBCreated() {
    stores.docStore = db.sublevel(DOC_STORE, {
      valueEncoding: safeJsonEncoding,
    });
    stores.bySeqStore = db.sublevel(BY_SEQ_STORE, { valueEncoding: 'json' });
    stores.attachmentStore = db.sublevel(ATTACHMENT_STORE, {
      valueEncoding: 'json',
    });
    stores.binaryStore = db.sublevel(BINARY_STORE, { valueEncoding: 'binary' });
    stores.localStore = db.sublevel(LOCAL_STORE, { valueEncoding: 'json' });
    stores.metaStore = db.sublevel(META_STORE, { valueEncoding: 'json' });
    /* istanbul ignore else */
    if (typeof opts.migrate === 'object') {
      // migration for leveldown
      opts.migrate.doMigrationTwo(db, stores, afterLastMigration);
    } else {
      afterLastMigration();
    }
  }

  function afterLastMigration() {
    stores.metaStore.get(UPDATE_SEQ_KEY, function (err, value) {
      if (typeof db._updateSeq === 'undefined') {
        db._updateSeq = value || 0;
      }
      stores.metaStore.get(DOC_COUNT_KEY, function (err, value) {
        db._docCount = !err ? value : 0;
        stores.metaStore.get(UUID_KEY, function (err, value) {
          instanceId = !err ? value : uuid();
          stores.metaStore.put(UUID_KEY, instanceId, function () {
            nextTick(function () {
              callback(null, api);
            });
          });
        });
      });
    });
  }

  function countDocs(callback) {
    /* istanbul ignore if */
    if (db.isClosed()) {
      return callback(new Error('database is closed'));
    }
    return callback(null, db._docCount); // use cached value
  }

  api._remote = false;
  /* istanbul ignore next */
  api.type = function () {
    return 'leveldb';
  };

  api._id = function (callback) {
    callback(null, instanceId);
  };

  api._info = function (callback) {
    const res = {
      doc_count: db._docCount,
      update_seq: db._updateSeq,
      backend_adapter: functionName(leveldown),
    };
    return nextTick(function () {
      callback(null, res);
    });
  };

  function tryCode(fun, args) {
    try {
      fun.apply(null, args);
    } catch (err) {
      args[args.length - 1](err);
    }
  }

  function executeNext() {
    const firstTask = db._queue.peekFront();

    if (firstTask.type === 'read') {
      runReadOperation(firstTask);
    } else {
      // write, only do one at a time
      runWriteOperation(firstTask);
    }
  }

  function runReadOperation(firstTask) {
    // do multiple reads at once simultaneously, because it's safe

    const readTasks = [firstTask];
    let i = 1;
    let nextTask = db._queue.get(i);
    while (typeof nextTask !== 'undefined' && nextTask.type === 'read') {
      readTasks.push(nextTask);
      i++;
      nextTask = db._queue.get(i);
    }

    let numDone = 0;

    readTasks.forEach(function (readTask) {
      const args = readTask.args;
      const callback = args[args.length - 1];
      args[args.length - 1] = function (...cbArgs) {
        callback.apply(null, cbArgs);
        if (++numDone === readTasks.length) {
          nextTick(function () {
            // all read tasks have finished
            readTasks.forEach(function () {
              db._queue.shift();
            });
            if (db._queue.length) {
              executeNext();
            }
          });
        }
      };
      tryCode(readTask.fun, args);
    });
  }

  function runWriteOperation(firstTask) {
    const args = firstTask.args;
    const callback = args[args.length - 1];
    args[args.length - 1] = function (...cbArgs) {
      callback.apply(null, cbArgs);
      nextTick(function () {
        db._queue.shift();
        if (db._queue.length) {
          executeNext();
        }
      });
    };
    tryCode(firstTask.fun, args);
  }

  // all read/write operations to the database are done in a queue,
  // similar to how websql/idb works. this avoids problems such
  // as e.g. compaction needing to have a lock on the database while
  // it updates stuff. in the future we can revisit this.
  function writeLock(fun) {
    return function (...args) {
      db._queue.push({
        fun,
        args,
        type: 'write',
      });

      if (db._queue.length === 1) {
        nextTick(executeNext);
      }
    };
  }

  // same as the writelock, but multiple can run at once
  function readLock(fun) {
    return function (...args) {
      db._queue.push({
        fun,
        args,
        type: 'read',
      });

      if (db._queue.length === 1) {
        nextTick(executeNext);
      }
    };
  }

  function formatSeq(n) {
    return ('0000000000000000' + n).slice(-16);
  }

  function parseSeq(s) {
    return parseInt(s, 10);
  }

  api._get = readLock(function (id, opts, callback) {
    opts = clone(opts);

    stores.docStore.get(id, function (err, metadata) {
      if (err || !metadata) {
        return callback(createError(MISSING_DOC, 'missing'));
      }

      let rev;
      if (!opts.rev) {
        rev = getWinningRev(metadata);
        const deleted = getIsDeleted(metadata, rev);
        if (deleted) {
          return callback(createError(MISSING_DOC, 'deleted'));
        }
      } else {
        rev = opts.latest ? getLatest(opts.rev, metadata) : opts.rev;
      }

      const seq = metadata.rev_map[rev];

      stores.bySeqStore.get(formatSeq(seq), function (err, doc) {
        if (!doc) {
          return callback(createError(MISSING_DOC));
        }
        /* istanbul ignore if */
        if ('_id' in doc && doc._id !== metadata.id) {
          // this failing implies something very wrong
          return callback(new Error('wrong doc returned'));
        }
        doc._id = metadata.id;
        if ('_rev' in doc) {
          /* istanbul ignore if */
          if (doc._rev !== rev) {
            // this failing implies something very wrong
            return callback(new Error('wrong doc returned'));
          }
        } else {
          // we didn't always store this
          doc._rev = rev;
        }
        return callback(null, { doc, metadata });
      });
    });
  });

  // not technically part of the spec, but if putAttachment has its own
  // method...
  api._getAttachment = function (docId, attachId, attachment, opts, callback) {
    const digest = attachment.digest;
    const type = attachment.content_type;

    stores.binaryStore.get(digest, function (err, attach) {
      if (err) {
        /* istanbul ignore if */
        if (err.name !== 'NotFoundError') {
          return callback(err);
        }
        // Empty attachment
        return callback(null, opts.binary ? createEmptyBluffer(type) : '');
      }

      if (opts.binary) {
        callback(null, readAsBluffer(attach, type));
      } else {
        callback(null, attach.toString('base64'));
      }
    });
  };

  api._bulkDocs = writeLock(function (req, opts, callback) {
    const newEdits = opts.new_edits;
    const results = new Array(req.docs.length);
    const fetchedDocs = new Map();
    const stemmedRevs = new Map();

    const txn = new LevelTransaction();
    let docCountDelta = 0;
    let newUpdateSeq = db._updateSeq;

    // parse the docs and give each a sequence number
    const userDocs = req.docs;
    const docInfos = userDocs.map(function (doc) {
      if (doc._id && isLocalId(doc._id)) {
        return doc;
      }
      const newDoc = parseDoc(doc, newEdits, api.__opts);

      if (newDoc.metadata && !newDoc.metadata.rev_map) {
        newDoc.metadata.rev_map = {};
      }

      return newDoc;
    });
    const infoErrors = docInfos.filter(function (doc) {
      return doc.error;
    });

    if (infoErrors.length) {
      return callback(infoErrors[0]);
    }

    // verify any stub attachments as a precondition test

    function verifyAttachment(digest, callback) {
      txn.get(stores.attachmentStore, digest, function (levelErr) {
        if (levelErr) {
          const err = createError(
            MISSING_STUB,
            'unknown stub attachment with digest ' + digest,
          );
          callback(err);
        } else {
          callback();
        }
      });
    }

    function verifyAttachments(finish) {
      const digests = [];
      userDocs.forEach(function (doc) {
        if (doc && doc._attachments) {
          Object.keys(doc._attachments).forEach(function (filename) {
            const att = doc._attachments[filename];
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
      let err;

      digests.forEach(function (digest) {
        verifyAttachment(digest, function (attErr) {
          if (attErr && !err) {
            err = attErr;
          }

          if (++numDone === digests.length) {
            finish(err);
          }
        });
      });
    }

    function fetchExistingDocs(finish) {
      let numDone = 0;
      let overallErr;
      function checkDone() {
        if (++numDone === userDocs.length) {
          return finish(overallErr);
        }
      }

      userDocs.forEach(function (doc) {
        if (doc._id && isLocalId(doc._id)) {
          // skip local docs
          return checkDone();
        }
        txn.get(stores.docStore, doc._id, function (err, info) {
          if (err) {
            /* istanbul ignore if */
            if (err.name !== 'NotFoundError') {
              overallErr = err;
            }
          } else {
            fetchedDocs.set(doc._id, info);
          }
          checkDone();
        });
      });
    }

    function compact(revsMap, callback) {
      let promise = Promise.resolve();
      revsMap.forEach(function (revs, docId) {
        // TODO: parallelize, for now need to be sequential to
        // pass orphaned attachment tests
        promise = promise.then(function () {
          return new Promise(function (resolve, reject) {
            api._doCompactionNoLock(docId, revs, { ctx: txn }, function (err) {
              /* istanbul ignore if */
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
        });
      });

      promise.then(function () {
        callback();
      }, callback);
    }

    function autoCompact(callback) {
      const revsMap = new Map();
      fetchedDocs.forEach(function (metadata, docId) {
        revsMap.set(docId, compactTree(metadata));
      });
      compact(revsMap, callback);
    }

    function finish() {
      compact(stemmedRevs, function (error) {
        /* istanbul ignore if */
        if (error) {
          complete(error);
        }
        if (api.auto_compaction) {
          return autoCompact(complete);
        }
        complete();
      });
    }

    function writeDoc(
      docInfo,
      winningRev,
      winningRevIsDeleted,
      newRevIsDeleted,
      isUpdate,
      delta,
      resultsIdx,
      callback2,
    ) {
      docCountDelta += delta;

      let err = null;
      let recv = 0;

      docInfo.metadata.winningRev = winningRev;
      docInfo.metadata.deleted = winningRevIsDeleted;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      if (newRevIsDeleted) {
        docInfo.data._deleted = true;
      }

      if (docInfo.stemmedRevs.length) {
        stemmedRevs.set(docInfo.metadata.id, docInfo.stemmedRevs);
      }

      const attachments = docInfo.data._attachments
        ? Object.keys(docInfo.data._attachments)
        : [];

      function attachmentSaved(attachmentErr) {
        recv++;
        if (!err) {
          /* istanbul ignore if */
          if (attachmentErr) {
            err = attachmentErr;
            callback2(err);
          } else if (recv === attachments.length) {
            finish();
          }
        }
      }

      function onMD5Load(doc, key, data, attachmentSaved) {
        return function (result) {
          saveAttachment(doc, MD5_PREFIX + result, key, data, attachmentSaved);
        };
      }

      function doMD5(doc, key, attachmentSaved) {
        return function (data) {
          binaryMd5(data, onMD5Load(doc, key, data, attachmentSaved));
        };
      }

      for (let i = 0; i < attachments.length; i++) {
        const key = attachments[i];
        const att = docInfo.data._attachments[key];

        if (att.stub) {
          // still need to update the refs mapping
          const id = docInfo.data._id;
          const rev = docInfo.data._rev;
          saveAttachmentRefs(id, rev, att.digest, attachmentSaved);
          continue;
        }
        var data;
        if (typeof att.data === 'string') {
          // input is assumed to be a base64 string
          try {
            data = atob(att.data);
          } catch (e) {
            callback(
              createError(BAD_ARG, 'Attachment is not a valid base64 string'),
            );
            return;
          }
          doMD5(docInfo, key, attachmentSaved)(data);
        } else {
          prepareAttachmentForStorage(
            att.data,
            doMD5(docInfo, key, attachmentSaved),
          );
        }
      }

      function finish() {
        let seq = docInfo.metadata.rev_map[docInfo.metadata.rev];
        /* istanbul ignore if */
        if (seq) {
          // check that there aren't any existing revisions with the same
          // revision id, else we shouldn't do anything
          return callback2();
        }
        seq = ++newUpdateSeq;
        docInfo.metadata.rev_map[docInfo.metadata.rev] = docInfo.metadata.seq =
          seq;
        const seqKey = formatSeq(seq);
        const batch = [
          {
            key: seqKey,
            value: docInfo.data,
            prefix: stores.bySeqStore,
            type: 'put',
          },
          {
            key: docInfo.metadata.id,
            value: docInfo.metadata,
            prefix: stores.docStore,
            type: 'put',
          },
        ];
        txn.batch(batch);
        results[resultsIdx] = {
          ok: true,
          id: docInfo.metadata.id,
          rev: docInfo.metadata.rev,
        };
        fetchedDocs.set(docInfo.metadata.id, docInfo.metadata);
        callback2();
      }

      if (!attachments.length) {
        finish();
      }
    }

    // attachments are queued per-digest, otherwise the refs could be
    // overwritten by concurrent writes in the same bulkDocs session
    const attachmentQueues = {};

    function saveAttachmentRefs(id, rev, digest, callback) {
      function fetchAtt() {
        return new Promise(function (resolve, reject) {
          txn.get(stores.attachmentStore, digest, function (err, oldAtt) {
            /* istanbul ignore if */
            if (err && err.name !== 'NotFoundError') {
              return reject(err);
            }
            resolve(oldAtt);
          });
        });
      }

      function saveAtt(oldAtt) {
        const ref = [id, rev].join('@');
        const newAtt: Record<string, any> = {};

        if (oldAtt) {
          if (oldAtt.refs) {
            // only update references if this attachment already has them
            // since we cannot migrate old style attachments here without
            // doing a full db scan for references
            newAtt.refs = oldAtt.refs;
            newAtt.refs[ref] = true;
          }
        } else {
          newAtt.refs = {};
          newAtt.refs[ref] = true;
        }

        return new Promise(function (resolve) {
          txn.batch([
            {
              type: 'put',
              prefix: stores.attachmentStore,
              key: digest,
              value: newAtt,
            },
          ]);
          resolve(!oldAtt);
        });
      }

      // put attachments in a per-digest queue, to avoid two docs with the same
      // attachment overwriting each other
      const queue = attachmentQueues[digest] || Promise.resolve();
      attachmentQueues[digest] = queue.then(function () {
        return fetchAtt()
          .then(saveAtt)
          .then(function (isNewAttachment) {
            callback(null, isNewAttachment);
          }, callback);
      });
    }

    function saveAttachment(docInfo, digest, key, data, callback) {
      const att = docInfo.data._attachments[key];
      delete att.data;
      att.digest = digest;
      att.length = data.length;
      const id = docInfo.metadata.id;
      const rev = docInfo.metadata.rev;
      att.revpos = parseInt(rev, 10);

      saveAttachmentRefs(id, rev, digest, function (err, isNewAttachment) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        // do not try to store empty attachments
        if (data.length === 0) {
          return callback(err);
        }
        if (!isNewAttachment) {
          // small optimization - don't bother writing it again
          return callback(err);
        }
        txn.batch([
          {
            type: 'put',
            prefix: stores.binaryStore,
            key: digest,
            value: Buffer.from(data, 'binary'),
          },
        ]);
        callback();
      });
    }

    function complete(err?) {
      /* istanbul ignore if */
      if (err) {
        return nextTick(function () {
          callback(err);
        });
      }
      txn.batch([
        {
          prefix: stores.metaStore,
          type: 'put',
          key: UPDATE_SEQ_KEY,
          value: newUpdateSeq,
        },
        {
          prefix: stores.metaStore,
          type: 'put',
          key: DOC_COUNT_KEY,
          value: db._docCount + docCountDelta,
        },
      ]);
      txn.execute(db, function (err) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        db._docCount += docCountDelta;
        db._updateSeq = newUpdateSeq;
        levelChanges.notify(name);
        nextTick(function () {
          callback(null, results);
        });
      });
    }

    if (!docInfos.length) {
      return callback(null, []);
    }

    verifyAttachments(function (err) {
      if (err) {
        return callback(err);
      }
      fetchExistingDocs(function (err) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        processDocs(
          revLimit,
          docInfos,
          api,
          fetchedDocs,
          txn,
          results,
          writeDoc,
          opts,
          finish,
        );
      });
    });
  });

  /** return obj of through */
  let throughStream: any;
  api._allDocs = function (opts, callback) {
    if ('keys' in opts) {
      return allDocsKeysQuery(this, opts);
    }
    return readLock(function (opts, callback) {
      opts = clone(opts);

      countDocs(function (err, docCount) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        const readstreamOpts: Record<string, any> = {};
        let skip = opts.skip || 0;
        if (opts.startkey) {
          readstreamOpts.gte = opts.startkey;
        }
        if (opts.endkey) {
          readstreamOpts.lte = opts.endkey;
        }
        if (opts.key) {
          readstreamOpts.gte = readstreamOpts.lte = opts.key;
        }
        if (opts.descending) {
          readstreamOpts.reverse = true;
          // switch start and ends
          const tmp = readstreamOpts.lte;
          readstreamOpts.lte = readstreamOpts.gte;
          readstreamOpts.gte = tmp;
        }
        let limit;
        if (typeof opts.limit === 'number') {
          limit = opts.limit;
        }
        if (
          limit === 0 ||
          ('gte' in readstreamOpts &&
            'lte' in readstreamOpts &&
            readstreamOpts.gte > readstreamOpts.lte)
        ) {
          // should return 0 results when start is greater than end.
          // normally level would "fix" this for us by reversing the order,
          // so short-circuit instead
          const returnVal: Record<string, any> = {
            total_rows: docCount,
            offset: opts.skip,
            rows: [],
          };
          /* istanbul ignore if */
          if (opts.update_seq) {
            returnVal.update_seq = db._updateSeq;
          }
          return callback(null, returnVal);
        }
        const results = [];
        const docstream = stores.docStore.readStream(readstreamOpts);

        throughStream = through(
          function (entry, _, next) {
            const metadata = entry.value;
            // winningRev and deleted are performance-killers, but
            // in newer versions of PouchDB, they are cached on the metadata
            const winningRev = getWinningRev(metadata);
            const deleted = getIsDeleted(metadata, winningRev);
            if (!deleted) {
              if (skip-- > 0) {
                next();
                return;
              } else if (typeof limit === 'number' && limit-- <= 0) {
                docstream.unpipe();
                docstream.destroy();
                next();
                return;
              }
            } else if (opts.deleted !== 'ok') {
              next();
              return;
            }
            function allDocsInner(data?) {
              const doc: Record<string, any> = {
                id: metadata.id,
                key: metadata.id,
                value: {
                  rev: winningRev,
                },
              };
              if (opts.include_docs) {
                doc.doc = data;
                doc.doc._rev = doc.value.rev;
                if (opts.conflicts) {
                  const conflicts = collectConflicts(metadata);
                  if (conflicts.length) {
                    doc.doc._conflicts = conflicts;
                  }
                }
                for (const att in doc.doc._attachments) {
                  if (Object.hasOwn(doc.doc._attachments, att)) {
                    doc.doc._attachments[att].stub = true;
                  }
                }
              }
              if (opts.inclusive_end === false && metadata.id === opts.endkey) {
                return next();
              } else if (deleted) {
                if (opts.deleted === 'ok') {
                  doc.value.deleted = true;
                  doc.doc = null;
                } else {
                  /* istanbul ignore next */
                  return next();
                }
              }
              results.push(doc);
              next();
            }
            if (opts.include_docs) {
              const seq = metadata.rev_map[winningRev];
              stores.bySeqStore.get(formatSeq(seq), function (err, data) {
                allDocsInner(data);
              });
            } else {
              allDocsInner();
            }
          },
          function (next) {
            Promise.resolve()
              .then(function () {
                if (opts.include_docs && opts.attachments) {
                  return fetchAttachments(results, stores, opts);
                }
              })
              .then(function () {
                const returnVal: Record<string, any> = {
                  total_rows: docCount,
                  offset: opts.skip,
                  rows: results,
                };

                /* istanbul ignore if */
                if (opts.update_seq) {
                  returnVal.update_seq = db._updateSeq;
                }
                callback(null, returnVal);
              }, callback);
            next();
          },
        ).on('unpipe', function () {
          throughStream?.end();
        });

        docstream.on('error', callback);

        docstream.pipe(throughStream);
      });
    })(opts, callback);
  };

  api._changes = function (opts) {
    opts = clone(opts);

    if (opts.continuous) {
      const id = name + ':' + uuid();
      levelChanges.addListener(name, id, api, opts);
      levelChanges.notify(name);
      return {
        cancel: function () {
          levelChanges.removeListener(name, id);
        },
      };
    }

    const descending = opts.descending;
    const results = [];
    let lastSeq = opts.since || 0;
    let called = 0;
    const streamOpts: Record<string, any> = {
      reverse: descending,
    };
    let limit;
    if ('limit' in opts && opts.limit > 0) {
      limit = opts.limit;
    }
    if (!streamOpts.reverse) {
      streamOpts.start = formatSeq(opts.since || 0);
    }

    const docIds = opts.doc_ids && new Set(opts.doc_ids);
    const filter = filterChange(opts);
    const docIdsToMetadata = new Map();

    function complete() {
      opts.done = true;
      if (opts.return_docs && opts.limit) {
        /* istanbul ignore if */
        if (opts.limit < results.length) {
          results.length = opts.limit;
        }
      }
      changeStream.unpipe(throughStream);
      changeStream.destroy();
      if (!opts.continuous && !opts.cancelled) {
        if (opts.include_docs && opts.attachments && opts.return_docs) {
          fetchAttachments(results, stores, opts).then(function () {
            opts.complete(null, { results, last_seq: lastSeq });
          });
        } else {
          opts.complete(null, { results, last_seq: lastSeq });
        }
      }
    }
    var changeStream = stores.bySeqStore.readStream(streamOpts);
    throughStream = through(
      function (data, _, next) {
        if (limit && called >= limit) {
          complete();
          return next();
        }
        if (opts.cancelled || opts.done) {
          return next();
        }

        const seq = parseSeq(data.key);
        const doc = data.value;

        if (seq === opts.since && !descending) {
          // couchdb ignores `since` if descending=true
          return next();
        }

        if (docIds && !docIds.has(doc._id)) {
          return next();
        }

        let metadata;

        function onGetMetadata(metadata) {
          const winningRev = getWinningRev(metadata);

          function onGetWinningDoc(winningDoc) {
            const change = opts.processChange(winningDoc, metadata, opts);
            change.seq = metadata.seq;

            const filtered = filter(change);
            if (typeof filtered === 'object') {
              return opts.complete(filtered);
            }

            if (filtered) {
              called++;

              if (opts.attachments && opts.include_docs) {
                // fetch attachment immediately for the benefit
                // of live listeners
                fetchAttachments([change], stores, opts).then(function () {
                  opts.onChange(change);
                });
              } else {
                opts.onChange(change);
              }

              if (opts.return_docs) {
                results.push(change);
              }
            }
            next();
          }

          if (metadata.seq !== seq) {
            // some other seq is later
            return next();
          }

          lastSeq = seq;

          if (winningRev === doc._rev) {
            return onGetWinningDoc(doc);
          }

          // fetch the winner

          const winningSeq = metadata.rev_map[winningRev];

          stores.bySeqStore.get(formatSeq(winningSeq), function (err, doc) {
            onGetWinningDoc(doc);
          });
        }

        metadata = docIdsToMetadata.get(doc._id);
        if (metadata) {
          // cached
          return onGetMetadata(metadata);
        }
        // metadata not cached, have to go fetch it
        stores.docStore.get(doc._id, function (err, metadata) {
          /* istanbul ignore if */
          if (
            opts.cancelled ||
            opts.done ||
            db.isClosed() ||
            isLocalId(metadata.id)
          ) {
            return next();
          }
          docIdsToMetadata.set(doc._id, metadata);
          onGetMetadata(metadata);
        });
      },
      function (next) {
        if (opts.cancelled) {
          return next();
        }
        if (opts.return_docs && opts.limit) {
          /* istanbul ignore if */
          if (opts.limit < results.length) {
            results.length = opts.limit;
          }
        }

        next();
      },
    ).on('unpipe', function () {
      throughStream?.end();
      complete();
    });
    changeStream.pipe(throughStream);
    return {
      cancel: function () {
        opts.cancelled = true;
        complete();
      },
    };
  };

  api._close = function (callback) {
    /* istanbul ignore if */
    if (db.isClosed()) {
      return callback(createError(NOT_OPEN));
    }
    db.close(function (err) {
      /* istanbul ignore if */
      if (err) {
        callback(err);
      } else {
        dbStore.delete(name);

        const adapterName = functionName(leveldown);
        const adapterStore = dbStores.get(adapterName);
        const viewNamePrefix = PouchDB.prefix + name + '-mrview-';
        const keys = [...adapterStore.keys()].filter((k) =>
          k.includes(viewNamePrefix),
        );
        keys.forEach((key) => {
          const eventEmitter = adapterStore.get(key);
          eventEmitter.removeAllListeners();
          eventEmitter.close();
          adapterStore.delete(key);
        });

        callback();
      }
    });
  };

  api._getRevisionTree = function (docId, callback) {
    stores.docStore.get(docId, function (err, metadata) {
      if (err) {
        callback(createError(MISSING_DOC));
      } else {
        callback(null, metadata.rev_tree);
      }
    });
  };

  api._doCompaction = writeLock(function (docId, revs, opts, callback) {
    api._doCompactionNoLock(docId, revs, opts, callback);
  });

  // the NoLock version is for use by bulkDocs
  api._doCompactionNoLock = function (docId, revs, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (!revs.length) {
      return callback();
    }
    const txn = opts.ctx || new LevelTransaction();

    txn.get(stores.docStore, docId, function (err, metadata) {
      /* istanbul ignore if */
      if (err) {
        return callback(err);
      }
      const seqs = revs.map(function (rev) {
        const seq = metadata.rev_map[rev];
        delete metadata.rev_map[rev];
        return seq;
      });
      traverseRevTree(
        metadata.rev_tree,
        function (isLeaf, pos, revHash, ctx, opts) {
          const rev = pos + '-' + revHash;
          if (revs.indexOf(rev) !== -1) {
            opts.status = 'missing';
          }
        },
      );

      let batch = [];
      batch.push({
        key: metadata.id,
        value: metadata,
        type: 'put',
        prefix: stores.docStore,
      });

      const digestMap = {};
      let numDone = 0;
      let overallErr;
      function checkDone(err?) {
        /* istanbul ignore if */
        if (err) {
          overallErr = err;
        }
        if (++numDone === revs.length) {
          // done
          /* istanbul ignore if */
          if (overallErr) {
            return callback(overallErr);
          }
          deleteOrphanedAttachments();
        }
      }

      function finish(err?) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        txn.batch(batch);
        if (opts.ctx) {
          // don't execute immediately
          return callback();
        }
        txn.execute(db, callback);
      }

      function deleteOrphanedAttachments() {
        const possiblyOrphanedAttachments = Object.keys(digestMap);
        if (!possiblyOrphanedAttachments.length) {
          return finish();
        }
        let numDone = 0;
        let overallErr;
        function checkDone(err?) {
          /* istanbul ignore if */
          if (err) {
            overallErr = err;
          }
          if (++numDone === possiblyOrphanedAttachments.length) {
            finish(overallErr);
          }
        }
        const refsToDelete = new Map();
        revs.forEach(function (rev) {
          refsToDelete.set(docId + '@' + rev, true);
        });
        possiblyOrphanedAttachments.forEach(function (digest) {
          txn.get(stores.attachmentStore, digest, function (err, attData) {
            /* istanbul ignore if */
            if (err) {
              if (err.name === 'NotFoundError') {
                return checkDone();
              } else {
                return checkDone(err);
              }
            }
            const refs = Object.keys(attData.refs || {}).filter(function (ref) {
              return !refsToDelete.has(ref);
            });
            const newRefs = {};
            refs.forEach(function (ref) {
              newRefs[ref] = true;
            });
            if (refs.length) {
              // not orphaned
              batch.push({
                key: digest,
                type: 'put',
                value: { refs: newRefs },
                prefix: stores.attachmentStore,
              });
            } else {
              // orphaned, can safely delete
              batch = batch.concat([
                {
                  key: digest,
                  type: 'del',
                  prefix: stores.attachmentStore,
                },
                {
                  key: digest,
                  type: 'del',
                  prefix: stores.binaryStore,
                },
              ]);
            }
            checkDone();
          });
        });
      }

      seqs.forEach(function (seq) {
        batch.push({
          key: formatSeq(seq),
          type: 'del',
          prefix: stores.bySeqStore,
        });
        txn.get(stores.bySeqStore, formatSeq(seq), function (err, doc) {
          /* istanbul ignore if */
          if (err) {
            if (err.name === 'NotFoundError') {
              return checkDone();
            } else {
              return checkDone(err);
            }
          }
          const atts = Object.keys(doc._attachments || {});
          atts.forEach(function (attName) {
            const digest = doc._attachments[attName].digest;
            digestMap[digest] = true;
          });
          checkDone();
        });
      });
    });
  };

  api._getLocal = function (id, callback) {
    stores.localStore.get(id, function (err, doc) {
      if (err) {
        callback(createError(MISSING_DOC));
      } else {
        callback(null, doc);
      }
    });
  };

  api._putLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (opts.ctx) {
      api._putLocalNoLock(doc, opts, callback);
    } else {
      api._putLocalWithLock(doc, opts, callback);
    }
  };

  api._putLocalWithLock = writeLock(function (doc, opts, callback) {
    api._putLocalNoLock(doc, opts, callback);
  });

  // the NoLock version is for use by bulkDocs
  api._putLocalNoLock = function (doc, opts, callback) {
    delete doc._revisions; // ignore this, trust the rev
    const oldRev = doc._rev;
    const id = doc._id;

    const txn = opts.ctx || new LevelTransaction();

    txn.get(stores.localStore, id, function (err, resp) {
      if (err && oldRev) {
        return callback(createError(REV_CONFLICT));
      }
      if (resp && resp._rev !== oldRev) {
        return callback(createError(REV_CONFLICT));
      }
      doc._rev = oldRev
        ? '0-' + (parseInt(oldRev.split('-')[1], 10) + 1)
        : '0-1';
      const batch = [
        {
          type: 'put',
          prefix: stores.localStore,
          key: id,
          value: doc,
        },
      ];

      txn.batch(batch);
      const ret = { ok: true, id: doc._id, rev: doc._rev };

      if (opts.ctx) {
        // don't execute immediately
        return callback(null, ret);
      }
      txn.execute(db, function (err) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        callback(null, ret);
      });
    });
  };

  api._removeLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (opts.ctx) {
      api._removeLocalNoLock(doc, opts, callback);
    } else {
      api._removeLocalWithLock(doc, opts, callback);
    }
  };

  api._removeLocalWithLock = writeLock(function (doc, opts, callback) {
    api._removeLocalNoLock(doc, opts, callback);
  });

  // the NoLock version is for use by bulkDocs
  api._removeLocalNoLock = function (doc, opts, callback) {
    const txn = opts.ctx || new LevelTransaction();
    txn.get(stores.localStore, doc._id, function (err, resp) {
      if (err) {
        /* istanbul ignore if */
        if (err.name !== 'NotFoundError') {
          return callback(err);
        } else {
          return callback(createError(MISSING_DOC));
        }
      }
      if (resp._rev !== doc._rev) {
        return callback(createError(REV_CONFLICT));
      }
      txn.batch([
        {
          prefix: stores.localStore,
          type: 'del',
          key: doc._id,
        },
      ]);
      const ret = { ok: true, id: doc._id, rev: '0-0' };
      if (opts.ctx) {
        // don't execute immediately
        return callback(null, ret);
      }
      txn.execute(db, function (err) {
        /* istanbul ignore if */
        if (err) {
          return callback(err);
        }
        callback(null, ret);
      });
    });
  };

  // close and delete open leveldb stores
  api._destroy = function (opts, callback) {
    let dbStore;
    const leveldownName = functionName(leveldown);
    /* istanbul ignore else */
    if (dbStores.has(leveldownName)) {
      dbStore = dbStores.get(leveldownName);
    } else {
      return callDestroy(name, callback);
    }

    /* istanbul ignore else */
    if (dbStore.has(name)) {
      levelChanges.removeAllListeners(name);

      dbStore.get(name).close(function () {
        dbStore.delete(name);
        callDestroy(name, callback);
      });
    } else {
      callDestroy(name, callback);
    }
  };
  function callDestroy(name, cb) {
    // May not exist if leveldown is backed by memory adapter
    /* istanbul ignore else */
    if ('destroy' in leveldown) {
      leveldown.destroy(name, cb);
    } else {
      cb(null);
    }
  }
}

export default LevelPouch;
