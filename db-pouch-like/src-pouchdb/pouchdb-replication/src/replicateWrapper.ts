import { BAD_REQUEST, createError } from 'pouchdb-errors';
import { clone } from 'pouchdb-utils';

import replicate from './replicate';
import Replication from './replication';

function toPouch(db, opts) {
  const PouchConstructor = opts.PouchConstructor;
  if (typeof db === 'string') {
    return new PouchConstructor(db, opts);
  } else {
    return db;
  }
}

function replicateWrapper(src, target, opts, callback?) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }

  if (opts.doc_ids && !Array.isArray(opts.doc_ids)) {
    throw createError(BAD_REQUEST, '`doc_ids` filter parameter is not a list.');
  }

  opts.complete = callback;
  opts = clone(opts);
  opts.continuous = opts.continuous || opts.live;
  opts.retry = 'retry' in opts ? opts.retry : false;
  // @ts-expect-error fix-types
  opts.PouchConstructor = opts.PouchConstructor || this;
  const replicateRet = new Replication(opts);
  const srcPouch = toPouch(src, opts);
  const targetPouch = toPouch(target, opts);
  replicate(srcPouch, targetPouch, opts, replicateRet);
  return replicateRet;
}

export { replicateWrapper as replicate, toPouch };
