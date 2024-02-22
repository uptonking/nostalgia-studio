import memdown from 'memdown';
import CoreLevelPouch from 'pouchdb-adapter-leveldb-core';

function MemDownPouch(opts, callback) {
  const _opts = { db: memdown, ...opts };

  // @ts-expect-error fix-types
  CoreLevelPouch.call(this, _opts, callback);
}

// overrides for normal LevelDB behavior on Node
MemDownPouch.valid = function () {
  return true;
};
MemDownPouch.use_prefix = false;

export default function (PouchDB) {
  PouchDB.adapter('memory', MemDownPouch, true);
}
