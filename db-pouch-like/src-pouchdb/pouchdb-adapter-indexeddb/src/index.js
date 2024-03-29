import { changesHandler } from 'pouchdb-utils';

import allDocs from './allDocs';
import bulkDocs from './bulkDocs';
import changes from './changes';
import destroy from './destroy';
import doCompaction from './doCompaction';
import { query, viewCleanup } from './find';
import get from './get';
import getAttachment from './getAttachment';
import getRevisionTree from './getRevisionTree';
// API implementations
import info from './info';
import purge from './purge';
import setup from './setup';
import { DOC_STORE } from './util';

var ADAPTER_NAME = 'indexeddb';

// TODO: Constructor should be capitalised
var idbChanges = new changesHandler();

// A shared list of database handles
var openDatabases = {};

function IndexeddbPouch(dbOpts, callback) {
  if (dbOpts.view_adapter) {
    console.log(
      'Please note that the indexeddb adapter manages _find indexes itself, therefore it is not using your specified view_adapter',
    );
  }

  var api = this;
  var metadata = {};

  // Wrapper that gives you an active DB handle. You probably want $t.
  var $ = function (fun) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      setup(openDatabases, api, dbOpts)
        .then(function (res) {
          metadata = res.metadata;
          args.unshift(res.idb);
          fun.apply(api, args);
        })
        .catch(function (err) {
          var last = args.pop();
          if (typeof last === 'function') {
            last(err);
          } else {
            console.error(err);
          }
        });
    };
  };
  // the promise version of $
  var $p = function (fun) {
    return function () {
      var args = Array.prototype.slice.call(arguments);

      return setup(openDatabases, api, dbOpts).then(function (res) {
        metadata = res.metadata;
        args.unshift(res.idb);

        return fun.apply(api, args);
      });
    };
  };
  // Wrapper that gives you a safe transaction handle. It's important to use
  // this instead of opening your own transaction from a db handle got from $,
  // because in the time between getting the db handle and opening the
  // transaction it may have been invalidated by index changes.
  var $t = function (fun, stores, mode) {
    stores = stores || [DOC_STORE];
    mode = mode || 'readonly';

    return function () {
      var args = Array.prototype.slice.call(arguments);
      var txn = {};
      setup(openDatabases, api, dbOpts)
        .then(function (res) {
          metadata = res.metadata;
          txn.txn = res.idb.transaction(stores, mode);
        })
        .catch(function (err) {
          console.error('Failed to establish transaction safely');
          console.error(err);
          txn.error = err;
        })
        .then(function () {
          args.unshift(txn);
          fun.apply(api, args);
        });
    };
  };

  api._openTransactionSafely = function (stores, mode, callback) {
    $t(
      function (txn, callback) {
        callback(txn.error, txn.txn);
      },
      stores,
      mode,
    )(callback);
  };

  api._remote = false;
  api.type = function () {
    return ADAPTER_NAME;
  };

  api._id = $(function (_, cb) {
    cb(null, metadata.db_uuid);
  });

  api._info = $(function (_, cb) {
    return info(metadata, cb);
  });

  api._get = $t(get);

  api._bulkDocs = $(function (_, req, opts, callback) {
    bulkDocs(api, req, opts, metadata, dbOpts, idbChanges, callback);
  });

  api._allDocs = $t(function (txn, opts, cb) {
    allDocs(txn, metadata, opts, cb);
  });

  api._getAttachment = getAttachment;

  api._changes = $t(function (txn, opts) {
    changes(txn, idbChanges, api, dbOpts, opts);
  });

  api._getRevisionTree = $t(getRevisionTree);
  api._doCompaction = $t(doCompaction, [DOC_STORE], 'readwrite');

  api._customFindAbstractMapper = {
    query: $p(query),
    viewCleanup: $p(viewCleanup),
  };

  api._destroy = function (opts, callback) {
    return destroy(dbOpts, openDatabases, idbChanges, callback);
  };

  api._close = $(function (db, cb) {
    delete openDatabases[dbOpts.name];
    db.close();
    cb();
  });

  // Closing and re-opening the DB re-generates native indexes
  api._freshen = function () {
    return new Promise(function (resolve) {
      api._close(function () {
        $(resolve)();
      });
    });
  };

  api._purge = $t(purge, [DOC_STORE], 'readwrite');

  // TODO: this setTimeout seems nasty, if its needed lets
  // figure out / explain why
  setTimeout(function () {
    callback(null, api);
  });
}

// TODO: this isnt really valid permanently, just being lazy to start
IndexeddbPouch.valid = function () {
  return true;
};

export default function (PouchDB) {
  PouchDB.adapter(ADAPTER_NAME, IndexeddbPouch, true);
}
