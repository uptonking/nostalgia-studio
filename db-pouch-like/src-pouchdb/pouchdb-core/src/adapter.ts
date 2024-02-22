import { EventEmitter } from 'events';
import {
  BAD_REQUEST,
  createError,
  INVALID_ID,
  INVALID_REV,
  MISSING_BULK_DOCS,
  MISSING_DOC,
  NOT_AN_OBJECT,
  QUERY_PARSE_ERROR,
  REV_CONFLICT,
  UNKNOWN_ERROR,
} from 'pouchdb-errors';
import {
  collectConflicts,
  collectLeaves,
  findPathToLeaf,
  isDeleted,
  isLocalId,
  rootToLeaf,
  traverseRevTree,
} from 'pouchdb-merge';
import {
  adapterFun,
  bulkGetShim,
  clone,
  guardedConsole,
  invalidIdError,
  isRemote,
  nextTick,
  pick,
  rev,
  upsert,
} from 'pouchdb-utils';

import type ActiveTasks from './active-tasks';
import Changes from './changes';

/*
 * A generic pouch adapter
 */

/** Wrapper for functions that call the bulkdocs api with a single doc,
 * if the first result is an error, return an error
 */
function yankError(callback: (arg0: any, arg1?: any) => void, docId: any) {
  return function (err: { docId: any }, results: string | any[]) {
    if (err || (results[0] && results[0].error)) {
      err = err || results[0];
      err.docId = docId;
      callback(err);
    } else {
      callback(null, results.length ? results[0] : results);
    }
  };
}

// clean docs given to us by the user
function cleanDocs(docs: string | any[]) {
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (doc._deleted) {
      delete doc._attachments; // ignore atts for deleted docs
    } else if (doc._attachments) {
      // filter out extraneous keys from _attachments
      const atts = Object.keys(doc._attachments);
      for (let j = 0; j < atts.length; j++) {
        const att = atts[j];
        doc._attachments[att] = pick(doc._attachments[att], [
          'data',
          'digest',
          'content_type',
          'length',
          'revpos',
          'stub',
        ]);
      }
    }
  }
}

/** compare two docs, first by _id then by _rev */
function compareByIdThenRev(
  a: { _id: number; _revisions: { start: any } },
  b: { _id: number; _revisions: { start: any } },
) {
  if (a._id === b._id) {
    const aStart = a._revisions ? a._revisions.start : 0;
    const bStart = b._revisions ? b._revisions.start : 0;
    return aStart - bStart;
  }
  return a._id < b._id ? -1 : 1;
}

// for every node in a revision tree computes its distance from the closest
// leaf
function computeHeight(revs: any) {
  const height: Record<string, number> = {};
  const edges: any[] = [];
  traverseRevTree(
    revs,
    function (isLeaf: any, pos: string, id: string, prnt: any) {
      const rev = pos + '-' + id;
      if (isLeaf) {
        height[rev] = 0;
      }
      if (prnt !== undefined) {
        edges.push({ from: prnt, to: rev });
      }
      return rev;
    },
  );

  edges.reverse();
  edges.forEach(function (edge) {
    if (height[edge.from] === undefined) {
      height[edge.from] = 1 + height[edge.to];
    } else {
      height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
    }
  });
  return height;
}

function allDocsKeysParse(opts: {
  keys: any[];
  skip: number;
  limit?: any;
  descending: boolean;
}) {
  const keys =
    'limit' in opts
      ? opts.keys.slice(opts.skip, opts.limit + opts.skip)
      : opts.skip > 0
        ? opts.keys.slice(opts.skip)
        : opts.keys;
  opts.keys = keys;
  opts.skip = 0;
  delete opts.limit;

  if (opts.descending) {
    keys.reverse();
    opts.descending = false;
  }
}

/** all compaction is done in a queue, to avoid attaching
 * too many listeners at once
 */
function doNextCompaction(self: {
  _compactionQueue: any[];
  get: (arg0: string) => Promise<any>;
  _compact: (arg0: any, arg1: (err: any, res: any) => void) => void;
}) {
  const task = self._compactionQueue[0];
  const opts = task.opts;
  const callback = task.callback;
  self
    .get('_local/compaction')
    .catch(function () {
      return false;
    })
    .then(function (doc) {
      if (doc && doc.last_seq) {
        opts.last_seq = doc.last_seq;
      }
      self._compact(opts, function (err, res) {
        /* istanbul ignore if */
        if (err) {
          callback(err);
        } else {
          callback(null, res);
        }
        nextTick(function () {
          self._compactionQueue.shift();
          if (self._compactionQueue.length) {
            doNextCompaction(self);
          }
        });
      });
    });
}

function appendPurgeSeq(
  db: { get: (arg0: string) => Promise<any>; put: (arg0: any) => any },
  docId: any,
  rev: any,
) {
  return db
    .get('_local/purges')
    .then(function (doc) {
      const purgeSeq = doc.purgeSeq + 1;
      doc.purges.push({
        docId,
        rev,
        purgeSeq,
      });
      if (
        'purged_infos_limit' in self &&
        doc.purges.length > self.purged_infos_limit
      ) {
        doc.purges.splice(
          0,
          doc.purges.length - (self.purged_infos_limit as number),
        );
      }
      doc.purgeSeq = purgeSeq;
      return doc;
    })
    .catch(function (err) {
      if (err.status !== 404) {
        throw err;
      }
      return {
        _id: '_local/purges',
        purges: [
          {
            docId,
            rev,
            purgeSeq: 0,
          },
        ],
        purgeSeq: 0,
      };
    })
    .then(function (doc) {
      return db.put(doc);
    });
}

function attachmentNameError(name: string) {
  if (name.charAt(0) === '_') {
    return (
      name +
      ' is not a valid attachment name, attachment ' +
      "names cannot start with '_'"
    );
  }
  return false;
}

export class AbstractPouchDB extends EventEmitter {
  static prefix: string;
  static activeTasks: ActiveTasks;

  activeTasks: ActiveTasks;
  _type: (...args: any[]) => any;
  adapter: string;

  post: (...args: any[]) => Promise<unknown>;
  put: (...args: any[]) => Promise<unknown>;
  putAttachment: (...args: any[]) => Promise<unknown>;
  removeAttachment: (...args: any[]) => Promise<unknown>;
  remove: (...args: any[]) => Promise<unknown>;
  revsDiff: (...args: any[]) => Promise<unknown>;
  bulkGet: (...args: any[]) => Promise<unknown>;
  compactDocument: (...args: any[]) => Promise<unknown>;
  compact: (...args: any[]) => Promise<unknown>;
  get: (...args: any[]) => Promise<unknown>;
  getAttachment: (...args: any[]) => Promise<unknown>;
  allDocs: (...args: any[]) => Promise<unknown>;
  close: (...args: any[]) => Promise<unknown>;
  info: (...args: any[]) => Promise<unknown>;
  id: (...args: any[]) => Promise<unknown>;
  bulkDocs: (...args: any[]) => Promise<unknown>;
  registerDependentDatabase: (...args: any[]) => Promise<unknown>;
  destroy: (...args: any[]) => Promise<unknown>;
  purge: (...args: any[]) => Promise<unknown>;
  _putLocal: any;
  _put: any;
  _compactionQueue: any;
  _getLocal: any;
  _closed: boolean;
  name: any;
  auto_compaction: boolean;
  _destroyed: boolean;
  _purge: any;

  _setup() {
    this.post = adapterFun('post', (doc, opts, cb) => {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      if (typeof doc !== 'object' || Array.isArray(doc)) {
        return cb(createError(NOT_AN_OBJECT));
      }
      this.bulkDocs({ docs: [doc] }, opts, yankError(cb, doc._id));
    });

    this.put = adapterFun('put', (doc, opts, cb) => {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      if (typeof doc !== 'object' || Array.isArray(doc)) {
        return cb(createError(NOT_AN_OBJECT));
      }
      invalidIdError(doc._id);
      if (isLocalId(doc._id) && typeof this._putLocal === 'function') {
        if (doc._deleted) {
          return this._removeLocal(doc, cb);
        } else {
          return this._putLocal(doc, cb);
        }
      }

      const putDoc = (next) => {
        if (typeof this._put === 'function' && opts.new_edits !== false) {
          this._put(doc, opts, next);
        } else {
          this.bulkDocs({ docs: [doc] }, opts, yankError(next, doc._id));
        }
      };

      if (opts.force && doc._rev) {
        transformForceOptionToNewEditsOption();
        putDoc(function (err) {
          const result = err ? null : { ok: true, id: doc._id, rev: doc._rev };
          cb(err, result);
        });
      } else {
        putDoc(cb);
      }

      function transformForceOptionToNewEditsOption() {
        const parts = doc._rev.split('-');
        const oldRevId = parts[1];
        const oldRevNum = parseInt(parts[0], 10);
        const newRevNum = oldRevNum + 1;
        const newRevId = rev();

        doc._revisions = {
          start: newRevNum,
          ids: [newRevId, oldRevId],
        };
        doc._rev = newRevNum + '-' + newRevId;
        opts.new_edits = false;
      }
    });

    this.putAttachment = adapterFun(
      'putAttachment',
      (docId, attachmentId, rev, blob, type) => {
        const api = this;
        if (typeof type === 'function') {
          type = blob;
          blob = rev;
          rev = null;
        }
        // Lets fix in https://github.com/pouchdb/pouchdb/issues/3267
        /* istanbul ignore if */
        if (typeof type === 'undefined') {
          type = blob;
          blob = rev;
          rev = null;
        }
        if (!type) {
          guardedConsole(
            'warn',
            'Attachment',
            attachmentId,
            'on document',
            docId,
            'is missing content_type',
          );
        }

        function createAttachment(doc) {
          let prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0;
          doc._attachments = doc._attachments || {};
          doc._attachments[attachmentId] = {
            content_type: type,
            data: blob,
            revpos: ++prevrevpos,
          };
          return api.put(doc);
        }

        return api.get(docId).then(
          function (doc: any) {
            if (doc._rev !== rev) {
              throw createError(REV_CONFLICT);
            }

            return createAttachment(doc);
          },
          function (err) {
            // create new doc
            /* istanbul ignore else */
            if (err.reason === MISSING_DOC.message) {
              return createAttachment({ _id: docId });
            } else {
              throw err;
            }
          },
        );
      },
    );

    this.removeAttachment = adapterFun(
      'removeAttachment',
      (docId, attachmentId, rev, callback) => {
        this.get(docId, (err, obj) => {
          /* istanbul ignore if */
          if (err) {
            callback(err);
            return;
          }
          if (obj._rev !== rev) {
            callback(createError(REV_CONFLICT));
            return;
          }
          /* istanbul ignore if */
          if (!obj._attachments) {
            return callback();
          }
          delete obj._attachments[attachmentId];
          if (Object.keys(obj._attachments).length === 0) {
            delete obj._attachments;
          }
          this.put(obj, callback);
        });
      },
    );

    this.remove = adapterFun('remove', (docOrId, optsOrRev, opts, callback) => {
      let doc;
      if (typeof optsOrRev === 'string') {
        // id, rev, opts, callback style
        doc = {
          _id: docOrId,
          _rev: optsOrRev,
        };
        if (typeof opts === 'function') {
          callback = opts;
          opts = {};
        }
      } else {
        // doc, opts, callback style
        doc = docOrId;
        if (typeof optsOrRev === 'function') {
          callback = optsOrRev;
          opts = {};
        } else {
          callback = opts;
          opts = optsOrRev;
        }
      }
      opts = opts || {};
      opts.was_delete = true;
      const newDoc = { _id: doc._id, _rev: doc._rev || opts.rev };
      // @ts-expect-error fix-types
      newDoc._deleted = true;
      if (isLocalId(newDoc._id) && typeof this._removeLocal === 'function') {
        return this._removeLocal(doc, callback);
      }
      this.bulkDocs({ docs: [newDoc] }, opts, yankError(callback, newDoc._id));
    });

    this.revsDiff = adapterFun('revsDiff', (req, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      const ids = Object.keys(req);

      if (!ids.length) {
        return callback(null, {});
      }

      let count = 0;
      const missing = new Map();

      function addToMissing(id, revId) {
        if (!missing.has(id)) {
          missing.set(id, { missing: [] });
        }
        missing.get(id).missing.push(revId);
      }

      function processDoc(id, rev_tree) {
        // Is this fast enough? Maybe we should switch to a set simulated by a map
        const missingForId = req[id].slice(0);
        traverseRevTree(rev_tree, function (isLeaf, pos, revHash, ctx, opts) {
          const rev = pos + '-' + revHash;
          const idx = missingForId.indexOf(rev);
          if (idx === -1) {
            return;
          }

          missingForId.splice(idx, 1);
          /* istanbul ignore if */
          if (opts.status !== 'available') {
            addToMissing(id, rev);
          }
        });

        // Traversing the tree is synchronous, so now `missingForId` contains
        // revisions that were not found in the tree
        missingForId.forEach(function (rev) {
          addToMissing(id, rev);
        });
      }

      ids.forEach((id) => {
        this._getRevisionTree(id, function (err, rev_tree) {
          if (err && err.status === 404 && err.message === 'missing') {
            missing.set(id, { missing: req[id] });
          } else if (err) {
            /* istanbul ignore next */
            return callback(err);
          } else {
            processDoc(id, rev_tree);
          }

          if (++count === ids.length) {
            // convert LazyMap to object
            const missingObj = {};
            missing.forEach(function (value, key) {
              missingObj[key] = value;
            });
            return callback(null, missingObj);
          }
        });
      }, this);
    });

    // _bulk_get API for faster replication, as described in
    // https://github.com/apache/couchdb-chttpd/pull/33
    // At the "abstract" level, it will just run multiple get()s in
    // parallel, because this isn't much of a performance cost
    // for local databases (except the cost of multiple transactions, which is
    // small). The http adapter overrides this in order
    // to do a more efficient single HTTP request.
    this.bulkGet = adapterFun('bulkGet', (opts, callback) => {
      bulkGetShim(this, opts, callback);
    });

    // compact one document and fire callback
    // by compacting we mean removing all revisions which
    // are further from the leaf in revision tree than max_height
    this.compactDocument = adapterFun(
      'compactDocument',
      (docId, maxHeight, callback) => {
        this._getRevisionTree(docId, (err, revTree) => {
          /* istanbul ignore if */
          if (err) {
            return callback(err);
          }
          const height = computeHeight(revTree);
          const candidates = [];
          const revs = [];
          Object.keys(height).forEach(function (rev) {
            if (height[rev] > maxHeight) {
              candidates.push(rev);
            }
          });

          traverseRevTree(revTree, function (isLeaf, pos, revHash, ctx, opts) {
            const rev = pos + '-' + revHash;
            if (opts.status === 'available' && candidates.indexOf(rev) !== -1) {
              revs.push(rev);
            }
          });
          this._doCompaction(docId, revs, callback);
        });
      },
    );

    // compact the whole database using single document
    // compaction
    this.compact = adapterFun('compact', (opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }

      opts = opts || {};

      this._compactionQueue = this._compactionQueue || [];
      this._compactionQueue.push({ opts, callback });
      if (this._compactionQueue.length === 1) {
        doNextCompaction(this);
      }
    });

    /* Begin api wrappers. Specific functionality to storage belongs in the _[method] */
    this.get = adapterFun('get', (id, opts, cb) => {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      if (typeof id !== 'string') {
        return cb(createError(INVALID_ID));
      }
      if (isLocalId(id) && typeof this._getLocal === 'function') {
        return this._getLocal(id, cb);
      }
      let leaves = [];

      const finishOpenRevs = () => {
        const result = [];
        let count = leaves.length;
        /* istanbul ignore if */
        if (!count) {
          return cb(null, result);
        }

        // order with open_revs is unspecified
        leaves.forEach((leaf) => {
          this.get(
            id,
            {
              rev: leaf,
              revs: opts.revs,
              latest: opts.latest,
              attachments: opts.attachments,
              binary: opts.binary,
            },
            function (err, doc) {
              if (!err) {
                // using latest=true can produce duplicates
                let existing;
                for (let i = 0, l = result.length; i < l; i++) {
                  if (result[i].ok && result[i].ok._rev === doc._rev) {
                    existing = true;
                    break;
                  }
                }
                if (!existing) {
                  result.push({ ok: doc });
                }
              } else {
                result.push({ missing: leaf });
              }
              count--;
              if (!count) {
                cb(null, result);
              }
            },
          );
        });
      };

      if (opts.open_revs) {
        if (opts.open_revs === 'all') {
          this._getRevisionTree(id, function (err, rev_tree) {
            /* istanbul ignore if */
            if (err) {
              return cb(err);
            }
            leaves = collectLeaves(rev_tree).map(function (leaf) {
              return leaf.rev;
            });
            finishOpenRevs();
          });
        } else {
          if (Array.isArray(opts.open_revs)) {
            leaves = opts.open_revs;
            for (let i = 0; i < leaves.length; i++) {
              const l = leaves[i];
              // looks like it's the only thing couchdb checks
              if (!(typeof l === 'string' && /^\d+-/.test(l))) {
                return cb(createError(INVALID_REV));
              }
            }
            finishOpenRevs();
          } else {
            return cb(createError(UNKNOWN_ERROR, 'function_clause'));
          }
        }
        return; // open_revs does not like other options
      }

      return this._get(id, opts, (err, result) => {
        if (err) {
          err.docId = id;
          return cb(err);
        }

        const doc = result.doc;
        const metadata = result.metadata;
        const ctx = result.ctx;

        if (opts.conflicts) {
          const conflicts = collectConflicts(metadata);
          if (conflicts.length) {
            doc._conflicts = conflicts;
          }
        }

        if (isDeleted(metadata, doc._rev)) {
          doc._deleted = true;
        }

        if (opts.revs || opts.revs_info) {
          const splittedRev = doc._rev.split('-');
          const revNo = parseInt(splittedRev[0], 10);
          const revHash = splittedRev[1];
          const paths = rootToLeaf(metadata.rev_tree);
          let path = null;

          for (let i = 0; i < paths.length; i++) {
            const currentPath = paths[i];
            const hashIndex = currentPath.ids.findIndex(
              (x) => x.id === revHash,
            );
            const hashFoundAtRevPos = hashIndex === revNo - 1;

            if (hashFoundAtRevPos || (!path && hashIndex !== -1)) {
              path = currentPath;
            }
          }

          /* istanbul ignore if */
          if (!path) {
            err = new Error('invalid rev tree');
            err.docId = id;
            return cb(err);
          }

          const pathId = doc._rev.split('-')[1];
          const indexOfRev = path.ids.findIndex((x) => x.id === pathId) + 1;
          const howMany = path.ids.length - indexOfRev;
          path.ids.splice(indexOfRev, howMany);
          path.ids.reverse();

          if (opts.revs) {
            doc._revisions = {
              start: path.pos + path.ids.length - 1,
              ids: path.ids.map(function (rev) {
                return rev.id;
              }),
            };
          }
          if (opts.revs_info) {
            let pos = path.pos + path.ids.length;
            doc._revs_info = path.ids.map(function (rev) {
              pos--;
              return {
                rev: pos + '-' + rev.id,
                status: rev.opts.status,
              };
            });
          }
        }

        if (opts.attachments && doc._attachments) {
          const attachments = doc._attachments;
          let count = Object.keys(attachments).length;
          if (count === 0) {
            return cb(null, doc);
          }
          Object.keys(attachments).forEach((key) => {
            this._getAttachment(
              doc._id,
              key,
              attachments[key],
              {
                binary: opts.binary,
                metadata,
                ctx,
              },
              function (err, data) {
                const att = doc._attachments[key];
                att.data = data;
                delete att.stub;
                delete att.length;
                if (!--count) {
                  cb(null, doc);
                }
              },
            );
          });
        } else {
          if (doc._attachments) {
            for (const key in doc._attachments) {
              /* istanbul ignore else */
              if (Object.hasOwn(doc._attachments, key)) {
                doc._attachments[key].stub = true;
              }
            }
          }
          cb(null, doc);
        }
      });
    });

    // TODO: I don't like this, it forces an extra read for every
    // attachment read and enforces a confusing api between
    // adapter.js and the adapter implementation
    this.getAttachment = adapterFun(
      'getAttachment',
      (docId, attachmentId, opts, callback) => {
        if (opts instanceof Function) {
          callback = opts;
          opts = {};
        }
        this._get(docId, opts, (err, res) => {
          if (err) {
            return callback(err);
          }
          if (res.doc._attachments && res.doc._attachments[attachmentId]) {
            opts.ctx = res.ctx;
            opts.binary = true;
            opts.metadata = res.metadata;
            this._getAttachment(
              docId,
              attachmentId,
              res.doc._attachments[attachmentId],
              opts,
              callback,
            );
          } else {
            return callback(createError(MISSING_DOC));
          }
        });
      },
    );

    this.allDocs = adapterFun('allDocs', (opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
      if (opts.start_key) {
        opts.startkey = opts.start_key;
      }
      if (opts.end_key) {
        opts.endkey = opts.end_key;
      }
      if ('keys' in opts) {
        if (!Array.isArray(opts.keys)) {
          return callback(new TypeError('options.keys must be an array'));
        }
        const incompatibleOpt = ['startkey', 'endkey', 'key'].filter(
          function (incompatibleOpt) {
            return incompatibleOpt in opts;
          },
        )[0];
        if (incompatibleOpt) {
          callback(
            createError(
              QUERY_PARSE_ERROR,
              'Query parameter `' +
                incompatibleOpt +
                '` is not compatible with multi-get',
            ),
          );
          return;
        }
        if (!isRemote(this)) {
          allDocsKeysParse(opts);
          if (opts.keys.length === 0) {
            return this._allDocs({ limit: 0 }, callback);
          }
        }
      }

      return this._allDocs(opts, callback);
    });

    this.close = adapterFun('close', (callback) => {
      this._closed = true;
      this.emit('closed');
      return this._close(callback);
    });

    this.info = adapterFun('info', (callback) => {
      this._info((err, info) => {
        if (err) {
          return callback(err);
        }
        // assume we know better than the adapter, unless it informs us
        info.db_name = info.db_name || this.name;
        info.auto_compaction = Boolean(this.auto_compaction && !isRemote(this));
        info.adapter = this.adapter;
        callback(null, info);
      });
    });

    this.id = adapterFun('id', (callback) => {
      return this._id(callback);
    });

    this.bulkDocs = adapterFun('bulkDocs', (req, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }

      opts = opts || {};

      if (Array.isArray(req)) {
        req = {
          docs: req,
        };
      }

      if (!req || !req.docs || !Array.isArray(req.docs)) {
        return callback(createError(MISSING_BULK_DOCS));
      }

      for (let i = 0; i < req.docs.length; ++i) {
        if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
          return callback(createError(NOT_AN_OBJECT));
        }
      }

      let attachmentError;
      req.docs.forEach(function (doc) {
        if (doc._attachments) {
          Object.keys(doc._attachments).forEach(function (name) {
            attachmentError = attachmentError || attachmentNameError(name);
            if (!doc._attachments[name].content_type) {
              guardedConsole(
                'warn',
                'Attachment',
                name,
                'on document',
                doc._id,
                'is missing content_type',
              );
            }
          });
        }
      });

      if (attachmentError) {
        return callback(createError(BAD_REQUEST, attachmentError));
      }

      if (!('new_edits' in opts)) {
        if ('new_edits' in req) {
          opts.new_edits = req.new_edits;
        } else {
          opts.new_edits = true;
        }
      }

      const adapter = this;
      if (!opts.new_edits && !isRemote(adapter)) {
        // ensure revisions of the same doc are sorted, so that
        // the local adapter processes them correctly (#2935)
        req.docs.sort(compareByIdThenRev);
      }

      cleanDocs(req.docs);

      // in the case of conflicts, we want to return the _ids to the user
      // however, the underlying adapter may destroy the docs array, so
      // create a copy here
      const ids = req.docs.map(function (doc) {
        return doc._id;
      });

      this._bulkDocs(req, opts, (err, res) => {
        if (err) {
          return callback(err);
        }
        if (!opts.new_edits) {
          // this is what couch does when new_edits is false
          res = res.filter(function (x) {
            return x.error;
          });
        }
        // add ids for error/conflict responses (not required for CouchDB)
        if (!isRemote(adapter)) {
          for (let i = 0, l = res.length; i < l; i++) {
            res[i].id = res[i].id || ids[i];
          }
        }

        callback(null, res);
      });
    });

    this.registerDependentDatabase = adapterFun(
      'registerDependentDatabase',
      (dependentDb, callback) => {
        const dbOptions = clone(this.__opts);
        if (this.__opts.view_adapter) {
          dbOptions.adapter = this.__opts.view_adapter;
        }

        // @ts-expect-error fix-types
        const depDB = new this.constructor(dependentDb, dbOptions);

        function diffFun(doc) {
          doc.dependentDbs = doc.dependentDbs || {};
          if (doc.dependentDbs[dependentDb]) {
            return false; // no update required
          }
          doc.dependentDbs[dependentDb] = true;
          return doc;
        }
        upsert(this, '_local/_pouch_dependentDbs', diffFun)
          .then(() => {
            callback(null, { db: depDB });
          })
          .catch(callback);
      },
    );

    this.destroy = adapterFun('destroy', (opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }

      const usePrefix = 'use_prefix' in this ? this.use_prefix : true;
      const destroyDb = () => {
        // call destroy method of the particular adaptor
        this._destroy(opts, (err, resp) => {
          if (err) {
            return callback(err);
          }
          this._destroyed = true;
          this.emit('destroyed');
          callback(null, resp || { ok: true });
        });
      };

      if (isRemote(this)) {
        // no need to check for dependent DBs if it's a remote DB
        return destroyDb();
      }

      this.get('_local/_pouch_dependentDbs', (err, localDoc) => {
        if (err) {
          /* istanbul ignore if */
          if (err.status !== 404) {
            return callback(err);
          } else {
            // no dependencies
            return destroyDb();
          }
        }
        const dependentDbs = localDoc.dependentDbs;
        const PouchDBCtor = this.constructor as typeof AbstractPouchDB;
        // const PouchDBCtor = this.constructor ;
        const deletedMap = Object.keys(dependentDbs).map((name) => {
          // use_prefix is only false in the browser
          /* istanbul ignore next */
          const trueName = usePrefix
            ? name.replace(new RegExp('^' + PouchDBCtor.prefix), '')
            : name;
          // @ts-expect-error fix-types
          return new PouchDBCtor(trueName, this.__opts).destroy();
        });
        Promise.all(deletedMap).then(destroyDb, callback);
      });
    });
  }

  _destroy(opts: any, arg1: (err: any, resp: any) => any) {
    throw new Error('Method not implemented.');
  }

  __opts: any;
  _bulkDocs: any;
  _id(callback: any) {
    throw new Error('Method not implemented.');
  }
  _info(arg0: (err: any, info: any) => any) {
    throw new Error('Method not implemented.');
  }
  _close(callback: any) {
    throw new Error('Method not implemented.');
  }
  _allDocs(arg0: { limit: number }, callback: any) {
    throw new Error('Method not implemented.');
  }
  _get(id: string, opts: any, arg2: (err: any, result: any) => any) {
    throw new Error('Method not implemented.');
  }
  _getAttachment(
    _id: any,
    key: string,
    arg2: any,
    arg3: { binary: any; metadata: any; ctx: any },
    arg4: (err: any, data: any) => void,
  ) {
    throw new Error('Method not implemented.');
  }
  _doCompaction(docId: any, revs: any[], callback: any) {
    throw new Error('Method not implemented.');
  }
  _getRevisionTree(id: string, arg1: (err: any, rev_tree: any) => any) {
    throw new Error('Method not implemented.');
  }
  _removeLocal(doc: any, cb: any) {
    throw new Error('Method not implemented.');
  }

  _compact(opts, callback) {
    const changesOpts = {
      return_docs: false,
      last_seq: opts.last_seq || 0,
    };
    const promises = [];
    let taskId;
    let compactedDocs = 0;

    const onChange = (row) => {
      this.activeTasks.update(taskId, {
        completed_items: ++compactedDocs,
      });
      promises.push(this.compactDocument(row.id, 0));
    };
    const onError = (err) => {
      this.activeTasks.remove(taskId, err);
      callback(err);
    };
    const onComplete = (resp) => {
      const lastSeq = resp.last_seq;
      Promise.all(promises)
        .then(() => {
          return upsert(this, '_local/compaction', (doc) => {
            if (!doc.last_seq || doc.last_seq < lastSeq) {
              doc.last_seq = lastSeq;
              return doc;
            }
            return false; // somebody else got here first, don't update
          });
        })
        .then(() => {
          this.activeTasks.remove(taskId);
          callback(null, { ok: true });
        })
        .catch(onError);
    };

    this.info().then((info) => {
      taskId = this.activeTasks.add({
        name: 'database_compaction',
        // @ts-expect-error fix-types
        total_items: info.update_seq - changesOpts.last_seq,
      });

      this.changes(changesOpts)
        .on('change', onChange)
        .on('complete', onComplete)
        .on('error', onError);
    });
  }

  changes(opts, callback?: (...args: any[]) => any) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    opts = opts || {};

    // By default set return_docs to false if the caller has opts.live = true,
    // this will prevent us from collecting the set of changes indefinitely
    // resulting in growing memory
    opts.return_docs = 'return_docs' in opts ? opts.return_docs : !opts.live;

    return new Changes(this, opts, callback);
  }

  type() {
    return typeof this._type === 'function' ? this._type() : this.adapter;
  }
}

// The abstract purge implementation expects a doc id and the rev of a leaf node in that doc.
// It will return errors if the rev doesn’t exist or isn’t a leaf.
// todo migrate to be inside class
AbstractPouchDB.prototype.purge = adapterFun(
  '_purge',
  function (this: AbstractPouchDB, docId, rev, callback) {
    if (typeof this._purge === 'undefined') {
      return callback(
        createError(
          UNKNOWN_ERROR,
          'Purge is not implemented in the ' + this.adapter + ' adapter.',
        ),
      );
    }
    const self = this;

    self._getRevisionTree(docId, (error, revs) => {
      if (error) {
        return callback(error);
      }
      if (!revs) {
        return callback(createError(MISSING_DOC));
      }
      let path;
      try {
        path = findPathToLeaf(revs, rev);
      } catch (error: any) {
        return callback(error.message || error);
      }
      self._purge(docId, path, (error, result) => {
        if (error) {
          return callback(error);
        } else {
          appendPurgeSeq(self, docId, rev).then(function () {
            return callback(null, result);
          });
        }
      });
    });
  },
);

export default AbstractPouchDB;
