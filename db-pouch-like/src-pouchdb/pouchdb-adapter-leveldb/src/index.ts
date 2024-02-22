import CoreLevelPouch from 'pouchdb-adapter-leveldb-core';

import migrate from './migrate';
import requireLeveldown from './requireLeveldown';

function LevelDownPouch(opts, callback) {
  // Users can pass in their own leveldown alternative here, in which case
  // it overrides the default one. (This is in addition to the custom builds.)
  let leveldown = opts.db;

  /* istanbul ignore else */
  if (!leveldown) {
    leveldown = requireLeveldown();

    /* istanbul ignore if */
    if (leveldown instanceof Error) {
      return callback(leveldown);
    }
  }

  const _opts = { db: leveldown, migrate, ...opts };

  // @ts-expect-error fix-types
  CoreLevelPouch.call(this, _opts, callback);
}

// overrides for normal LevelDB behavior on Node
LevelDownPouch.valid = function () {
  return true;
};

LevelDownPouch.use_prefix = false;

export default function (PouchDB) {
  PouchDB.adapter('leveldb', LevelDownPouch, true);
}
